import {
    APIGatewayProxyResultV2,
    APIGatewayProxyWebsocketEventV2,
} from 'aws-lambda';
import { game } from "./game";

export const handler = async (event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResultV2> => {
    return await game(event);
};