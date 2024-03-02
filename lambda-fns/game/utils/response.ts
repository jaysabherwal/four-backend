import {
    APIGatewayProxyResultV2
} from 'aws-lambda';

const badRequestResponse = (body: string) => {
    return { statusCode: 400, body }
};

const okResponse = (body?: string): APIGatewayProxyResultV2 => {
    return { statusCode: 200, body }
};

const errorResponse = () => {
    return { statusCode: 500, body: 'Internal Server Error' };
};

export {
    badRequestResponse,
    errorResponse,
    okResponse
}