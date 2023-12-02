import {
    APIGatewayProxyResultV2,
    APIGatewayProxyWebsocketEventV2,
} from 'aws-lambda';
import { ApiGatewayManagementApi } from "@aws-sdk/client-apigatewaymanagementapi";
import { Action } from "./models/action";
import { Message } from "./models/message";
import { Game, gameToJson, initialiseGame } from "./models/game";
import { create, retrieve, updateOnJoin, updateOnMove } from './utils/dynamodb';
import { logger } from "./utils/logger";

export const game =  async (event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const { connectionId } = event.requestContext;

        if (!event.body) {
            throw new Error('Event body is missing');
        }

        const message = JSON.parse(event.body).data as Message;

        const apigwManagementApi = new ApiGatewayManagementApi({
            apiVersion: '2018-11-29',
            endpoint: event.requestContext.domainName + '/' + event.requestContext.stage,
        });

        logger.info(`Action received: ${message.action}`);

        switch (message.action) {
            case Action.CREATE:
                await createGame(connectionId, apigwManagementApi);
                break;
            case Action.JOIN:
                if (!message.data) {
                    return { statusCode: 400 };
                }
                await joinGame(message.data.gameId, connectionId, apigwManagementApi);
                break;
            case Action.MOVE:
                if (!message.data || !message.data.x || !message.data.y) {
                    return { statusCode: 400 };
                }
                await move(message.data.gameId, message.data.x, message.data.y, apigwManagementApi, connectionId);
                break;
            default:
                throw new Error(`Could not perform action: ${message.action}`);
        }

        return { statusCode: 200 };
    } catch (error: any) {
        logger.error(error);
        return { statusCode: 500, body: "Error thrown" };
    }
}

const createGame = async (connectionId: string, apigwManagementApi: ApiGatewayManagementApi) => {

    logger.info(`Creating game`);

    const game = initialiseGame(connectionId);

    await create(game);

    logger.info(`Posting to connection`);

    await sendData(connectionId, game, apigwManagementApi);
};

const joinGame = async (gameId: string, connectionId: string, apigwManagementApi: ApiGatewayManagementApi): Promise<void> => {
    const game = await updateOnJoin(gameId, connectionId);
 
    const postData = gameToJson(game);

    await sendData(game.hostConnection, postData, apigwManagementApi);
    await sendData(connectionId, postData, apigwManagementApi);
}

const move = async (gameId: string, x: number, y: number, apigwManagementApi: ApiGatewayManagementApi, connectionId: string): Promise<void> => {
    let game = await retrieve(gameId);

    if (!game.opponentConnection) {
        throw new Error('Game is not in progress');
    }

    let cell = game.state[x][y];

    if (!cell) {
        throw new Error();
    }

    if (!isMoveValid(game, connectionId)) {
        throw new Error('User is not authorized to perform the next move');
    }

    cell = game.isHostsTurn ? 'r' : 'y';

    await updateOnMove(gameId, game.state, game.isHostsTurn);

    const postData = gameToJson(game);

    await sendData(game.hostConnection, postData, apigwManagementApi);
    await sendData(game.opponentConnection!, postData, apigwManagementApi);
};

const isMoveValid = (game: Game, connectionId: string) => {
    const hostCanMovie = game.isHostsTurn && connectionId === game.hostConnection;
    const opponentCanMove = !game.isHostsTurn && connectionId === game.opponentConnection;
    return hostCanMovie || opponentCanMove;
};

const sendData = async (connectionId: string, game: Game, apigwManagementApi: ApiGatewayManagementApi) => {
    return apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(gameToJson(game)) });
};