import { APIGatewayProxyEvent } from "aws-lambda"

import * as AWS from 'aws-sdk';

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

export const handler = async (event: APIGatewayProxyEvent) => {
  const tableName = process.env.TABLE_NAME;

  if (!tableName) {
    throw new Error('tableName not specified in process.env.TABLE_NAME');
  }

  //try {
  //   const apigwManagementApi = new AWS.ApiGatewayManagementApi({
  //     apiVersion: '2018-11-29',
  //     endpoint: event.requestContext.domainName + '/' + event.requestContext.stage,
  //   });
    
  //   const connectionData = await ddb.get(
  //     { 
  //       TableName: tableName, 
  //       Key: {
  //         "GameId": "gameId"
  //       } 
  //     }
  //   ).promise();
  //   await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: postData }).promise();

  // } catch (e) {
  //   return { statusCode: 500, body: e };
  // }

  // const deleteParams = {
  //   TableName: tableName,
  //   Key: {
  //     connectionId: event.requestContext.connectionId,
  //   },
  // };

  // try {
  //   await ddb.delete(deleteParams).promise();
  // } catch (err) {
  //   return { statusCode: 500, body: 'Failed to disconnect: ' + JSON.stringify(err) };
  // }

  //return { statusCode: 200, body: 'Disconnected.' };
};