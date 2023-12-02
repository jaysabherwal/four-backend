import { WebSocketApi, WebSocketStage } from '@aws-cdk/aws-apigatewayv2-alpha';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { Stack } from 'aws-cdk-lib';
import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  StackProps,
} from "aws-cdk-lib";
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Code, Function, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class Main extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new Table(this, `${id}-games`, {
      partitionKey: { name: "id", type: AttributeType.STRING },
      tableName: "four-games",
      removalPolicy: RemovalPolicy.DESTROY,
      timeToLiveAttribute: "expiration",
    });

    const nodeModulesLayer = new LayerVersion(
      this,
      `${id}-node-modules-layer`,
      {
        compatibleRuntimes: [Runtime.NODEJS_LATEST],
        code: Code.fromAsset("./artifacts/nodeModules.zip"),
        layerVersionName: "four-node-modules-layer",
        removalPolicy: RemovalPolicy.DESTROY,
      }
    );

    const disconnectHandler = new Function(this, `${id}-disconnect`, {
      functionName: "four-disconnect-function",
      runtime: Runtime.NODEJS_LATEST,
      code: Code.fromAsset("./artifacts/disconnect.zip"),
      handler: "disconnect/index.handler",
      timeout: Duration.seconds(60),
      layers: [nodeModulesLayer],
      environment: {
        TABLE_ARN: table.tableName,
        NODE_PATH: "./:/opt/node_modules",
      },
    });

    let webSocketApi: WebSocketApi = new WebSocketApi(this, `${id}-web-socket-api`, {
      disconnectRouteOptions: { integration: new WebSocketLambdaIntegration(`${id}-disconnect-integration`, disconnectHandler)}
    });

    const stage = new WebSocketStage(this, `${id}-stage`, {
      webSocketApi,
      stageName: "live",
      autoDeploy: true,
    });

    const gameHandler = new Function(this, `${id}-game`, {
      functionName: "four-game-function",
      runtime: Runtime.NODEJS_LATEST,
      code: Code.fromAsset("./artifacts/game.zip"),
      handler: "game/index.handler",
      timeout: Duration.seconds(60),
      layers: [nodeModulesLayer],
      environment: {
        TABLE_NAME: table.tableName,
        NODE_PATH: "./:/opt/node_modules",
      },
    });

    webSocketApi.addRoute("game", {
      integration: new WebSocketLambdaIntegration(`${id}-game-integration`, gameHandler),
    });

    webSocketApi.addRoute('disconnect', {
      integration: new WebSocketLambdaIntegration(`${id}-disconnect-integration`, disconnectHandler),
    });

    webSocketApi.grantManageConnections(gameHandler);
    table.grantReadWriteData(gameHandler);
    table.grantReadWriteData(disconnectHandler);

    new CfnOutput(this, "WS_API_Url", {
      value: webSocketApi.apiEndpoint ?? "Something went wrong with the deploy",
    });
  }
}
