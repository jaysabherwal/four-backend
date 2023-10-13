import { APIGatewayProxyEvent } from "aws-lambda"
import { ApiGatewayManagementApi } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Action } from "./models/action";
import { Message } from "./models/message";
import { Game, gameToJson, initialiseGame } from "./models/game";
import { Response } from "./models/response";
import { create, retrieve, updateOnJoin, updateOnMove } from './utils/dynamodb';
import { LambdaLog } from 'lambda-log';

const ddb = new DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });
const log = new LambdaLog();

export const game = async (event: APIGatewayProxyEvent): Promise<Response> => {
    try {
        const { connectionId } = event.requestContext;

        if (!connectionId) {
            throw new Error('Could not get connection id from event')
        }

        if (!event.body) {
            throw new Error('Event body is missing');
        }

        const message = JSON.parse(event.body).data as Message;

        const apigwManagementApi = new ApiGatewayManagementApi({
            apiVersion: '2018-11-29',
            endpoint: event.requestContext.domainName + '/' + event.requestContext.stage,
        });

        log.info(`Action received: ${message.action}`);

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
                await move(message.data.gameId, message.data.x, message.data.y, apigwManagementApi);
                break;
            default:
                throw new Error(`Could not perform action: ${message.action}`);
        }

        return { statusCode: 200 };
    } catch (error: any) {
        log.error(error);
        return { statusCode: 500, body: "Unknown error thrown from Lambda" };
    }
}

const createGame = async (connectionId: string, apigwManagementApi: ApiGatewayManagementApi) => {

    log.info(`Creating game`);

    const game = initialiseGame(connectionId);

    const { $response } = await create(game, ddb);

    if ($response.error) {
        log.error(`Error storing game`);
        return;
    }

    log.info(`Posting to connection`);

    await sendData(connectionId, game, apigwManagementApi);
};

const joinGame = async (gameId: string, connectionId: string, apigwManagementApi: ApiGatewayManagementApi): Promise<void> => {
    const { $response } = await updateOnJoin(gameId, connectionId, ddb);

    if ($response.error) {
        log.error('Could not update data upon JOIN')
        return;
    }

    const game = $response.data as Game;

    const postData = gameToJson(game);

    await sendData(game.hostConnection, postData, apigwManagementApi);
    await sendData(connectionId, postData, apigwManagementApi);
}

const move = async (gameId: string, x: number, y: number, apigwManagementApi: ApiGatewayManagementApi): Promise<void> => {
    let game = await retrieve(gameId, ddb);
    let cell = game.state[x][y];

    if (!cell) {
        throw new Error();
    }

    // confirm the move is by the user?

    cell = game.isHostsTurn ? 'r' : 'y';

    const { $response } = await updateOnMove(gameId, game.state, ddb);

    if ($response.error) {
        log.error("");
        return;
    }

    const postData = gameToJson(game);

    await sendData(game.hostConnection, postData, apigwManagementApi);
    await sendData(game.opponentConnection!, postData, apigwManagementApi);
};

const sendData = async (connectionId: string, game: Game, apigwManagementApi: ApiGatewayManagementApi) => {
    return apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(gameToJson(game)) }).promise();
};