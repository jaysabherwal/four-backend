import { APIGatewayProxyEvent } from "aws-lambda"
import { ApiGatewayManagementApi } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Action } from "./models/action";
import { Game, gameToJson, initialiseGame } from "./models/game";
import { Response } from "./models/response";
import { create, updateOnJoin } from './utils/dynamodb';

const ddb = new DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

export const game = async (event: APIGatewayProxyEvent): Promise<Response> => {
    try {
        const { connectionId } = event.requestContext;

        if (!connectionId) {
            throw new Error('Could not get connection id from event')
        }

        if (!event.body) {
            throw new Error('Event body is missing');
        }

        // verify event..?

        // parse
        const message = JSON.parse(event.body).data;

        const apigwManagementApi = new ApiGatewayManagementApi({
            apiVersion: '2018-11-29',
            endpoint: event.requestContext.domainName + '/' + event.requestContext.stage,
        });

        console.log(`Action received: ${message.action}`);

        switch (message.action) {
            case Action.CREATE:
                await createGame(connectionId, apigwManagementApi);
                break;
            case Action.JOIN:
                await joinGame(message.data.gameId, connectionId, apigwManagementApi);
                break;
            case Action.MOVE:
                await move(message.data.gameId, '', '');
                break;
            default:
                throw new Error(`Could not perform action: ${message.action}`);
        }

        return { statusCode: 200 };
    } catch (error: any) {
        console.error({
            message: error,
        });
        return { statusCode: 500, body: "Unknown error thrown from Lambda" };
    }
}

const createGame = async (connectionId: string, apigwManagementApi: ApiGatewayManagementApi) => {

    console.log(`Creating game`);

    const game = initialiseGame(connectionId);

    const { $response } = await create(game, ddb);

    if ($response.error) {
        console.error(`Error storing game`);
    }

    console.log(`Posting to connection`);

    await sendData(connectionId, game, apigwManagementApi);
};

const joinGame = async (gameId: string, connectionId: string, apigwManagementApi: ApiGatewayManagementApi): Promise<void> => {
    const { $response } = await updateOnJoin(gameId, connectionId, ddb);

    if ($response.error) {
        console.error('Could not update data upon JOIN')
        return;
    }

    const game = $response.data as Game;

    const postData = gameToJson(game);

    await sendData(game.hostConnection, postData, apigwManagementApi);
    await sendData(connectionId, postData, apigwManagementApi);
}

const move = async (gameId: string, x: string, y: string): Promise<void> => {

};

const sendData = async (connectionId: string, game: Game, apigwManagementApi: ApiGatewayManagementApi) => {
    return apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(gameToJson(game)) }).promise();
};