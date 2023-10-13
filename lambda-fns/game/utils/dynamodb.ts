import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Game } from "../models/game";

const TABLE_NAME = process.env.TABLE_NAME || "default";

export const create = async (game: Game, ddb: DocumentClient) => {
    const date = new Date();
    date.setHours(date.getHours() + 1);

    const putParams = {
        TableName: TABLE_NAME,
        Item: {
            ...game,
            expiration: date.getTime() // this gives the wrong time?
        },
    };

    return ddb.put(putParams).promise();
}

export const retrieve = async (gameId: string, ddb: DocumentClient): Promise<Game> => {
    const params = {
        Key: {
            "GameId": gameId
        },
        TableName: TABLE_NAME
    };

    const { Item } = await ddb.get(params).promise();


    if (!Item) {
        console.error('Could not find game');
    }

    return Item as Game;
};

export const updateOnJoin = async (gameId: string, opponentConnectionId: string, ddb: DocumentClient ) => {
    const putParams = {
        Key: {
            "GameId": gameId
        },
        UpdateExpression: `SET opponentConnectionId = :opponentConnectionId`,
        ExpressionValueAttributes: {
            ":opponentConnectionId": opponentConnectionId
        },
        TableName: TABLE_NAME,
        ReturnValues: "ALL_NEW"
    };

    return ddb.update(putParams).promise();
};

export const updateOnMove = async (gameId: string, state: ("r" | "y" | null)[][], ddb: DocumentClient) => {
    const putParams = {
        Key: {
            "GameId": gameId
        },
        UpdateExpression: `SET state = :state`,
        ExpressionValueAttributes: {
            'state': JSON.stringify(state)
        },
        TableName: TABLE_NAME,
        ReturnValues: "UPDATED_NEW"
    };

    return ddb.update(putParams).promise();
};

export const updateOnDisconnect = () => {

};