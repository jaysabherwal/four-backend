import { Game } from "../models/game";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { logger } from "./logger";

const TABLE_NAME = process.env.TABLE_NAME || "default";

const client = new DynamoDBClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });
const documentClient = DynamoDBDocumentClient.from(client);

export const create = async (game: Game) => {
    try {
        const date = new Date();
        date.setHours(date.getHours() + 1);
    
        const params = {
            TableName: TABLE_NAME,
            Item: {
                ...game,
                expiration: date.getTime() // this gives the wrong time?
            },
        };
    
        await documentClient.send(new PutCommand(params));
    } catch (error) {
        logger.error('Error creating game');
        throw error;
    }
}

export const retrieve = async (gameId: string): Promise<Game> => {

    try {        
        const params = {
            Key: {
                "GameId": gameId
            },
            TableName: TABLE_NAME
        };
    
        const { Item } = await documentClient.send(new GetCommand(params));
    
    
        if (!Item) {
            console.error('Could not find game');
        }
    
        return Item as Game;
    } catch (error) {
        logger.error('Error retrieving game');
        throw error;
    }
};

export const updateOnJoin = async (gameId: string, opponentConnectionId: string ): Promise<Game> => {
    try {
        const params = {
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
    
        const { Attributes } = await documentClient.send(new UpdateCommand(params));

        return Attributes as Game;
    } catch (error) {
        logger.error('Error updating game');
        throw error;
    }
    
};

export const updateOnMove = async (gameId: string, state: ("r" | "y" | null)[][], isHostsTurn: boolean) => {
    try {
        const params = {
            Key: {
                "GameId": gameId
            },
            UpdateExpression: `SET state = :state, isHostsTurn = :isHostsTurn`,
            ExpressionValueAttributes: {
                ':state': JSON.stringify(state),
                ':isHostsTurn': !isHostsTurn
            },
            TableName: TABLE_NAME,
            ReturnValues: "UPDATED_NEW"
        };
    
        await documentClient.send(new UpdateCommand(params));
    } catch (error) {
        logger.error('Error updating game with move');
        throw error;
    }
    
};

export const updateOnDisconnect = () => {

};