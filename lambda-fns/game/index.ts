import { APIGatewayProxyEvent } from "aws-lambda";
import { game } from "./game";

export const handler = async (event: APIGatewayProxyEvent) => {
    await game(event);
};