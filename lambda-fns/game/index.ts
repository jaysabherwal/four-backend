import { APIGatewayProxyEvent } from "aws-lambda"
import { ApiGatewayManagementApi } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Action } from "./models/action";
import { Game } from "./models/game";
import { retrieve, update } from './utils/dynamodb';

const ddb = new DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

const tableName = process.env.TABLE_NAME;

if (!tableName) {
    throw new Error('tableName not specified under TABLE_NAME environment variable');
}

export const handler = async (event: APIGatewayProxyEvent) => {
    try {
        const { connectionId } = event.requestContext;
    
        if (!connectionId) {
            throw new Error('Could not get connection id from event')
        }

        if (!event.body) {
            throw new Error('Event body is missing');
        }

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
            default:
                throw new Error(`Could not perform action: ${message.action}`);
        }

        console.log(`Lambda finished`);

        return { statusCode: 200, body: "Lambda ran successfully." };
    } catch (error: any) {
        console.error({
            message: error,
        });
        return { statusCode: 500, body: "Unknown error thrown from Lambda", detail: error };
    }
}

const createGame = async (connectionId: string, apigwManagementApi: ApiGatewayManagementApi) => {
    console.log(`Creating game`);

    const game = new Game();
    
    game.initialise(connectionId);

    const date = new Date();
    date.setHours(date.getHours() + 1);

    const putParams = {
        TableName: tableName,
        Item: {
            ...game.toJson(true),
            expiration: date.getTime() // this gives the wrong time
        },
    };

    console.log(`Storing game: ${JSON.stringify(putParams, null, 2)}`);

    await ddb.put(putParams).promise();

    console.log(`Posting to connection`)

    await sendData(connectionId, game, apigwManagementApi);
};

const joinGame = async (gameId: string, connectionId: string, apigwManagementApi: ApiGatewayManagementApi) => {
    const gameJson = await retrieve(gameId, ddb, tableName);

    if (!gameJson.Item) {
        console.error('Could not find game');
        return;
    }

    const game = new Game().mapFromObject(gameJson.Item);

    game.opponentConnection = connectionId;

    const { $response } = await update(game.toJson(true), gameId, ddb, tableName);

    if ($response.error) {
        console.error('Could not update data upon JOIN')
        return;
    }

    const postData = game.toJson();

    await sendData(game.hostConnection, postData, apigwManagementApi);
    await sendData(game.opponentConnection, postData, apigwManagementApi);
}

const move = (gameId: string, move: string) => {

};

const sendData = async (connectionId: string, game: Game, apigwManagementApi: ApiGatewayManagementApi) => {
    await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(game.toJson()) }).promise();
};