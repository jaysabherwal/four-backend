import { LambdaWebSocketIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import { WebSocketApi, WebSocketStage } from "@aws-cdk/aws-apigatewayv2";
import { AttributeType, Table } from "@aws-cdk/aws-dynamodb";
import { Code, Function, LayerVersion, Runtime } from "@aws-cdk/aws-lambda";
import { PolicyStatement } from "@aws-cdk/aws-iam";
import {
  CfnOutput,
  Construct,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
} from "@aws-cdk/core";

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
        compatibleRuntimes: [Runtime.NODEJS_14_X],
        code: Code.fromAsset("./artifacts/nodeModules.zip"),
        layerVersionName: "four-node-modules-layer",
        removalPolicy: RemovalPolicy.DESTROY,
      }
    );

    const disconnectHandler = new Function(this, `${id}-disconnect`, {
      functionName: "four-disconnect-function",
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset("./artifacts/disconnect.zip"),
      handler: "disconnect/index.handler",
      timeout: Duration.seconds(60),
      layers: [nodeModulesLayer],
      environment: {
        TABLE_ARN: table.tableName,
        NODE_PATH: "./:/opt/node_modules",
      },
    });

    const gameHandler = new Function(this, `${id}-game`, {
      functionName: "four-game-function",
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset("./artifacts/game.zip"),
      handler: "game/index.handler",
      timeout: Duration.seconds(60),
      layers: [nodeModulesLayer],
      environment: {
        TABLE_NAME: table.tableName,
        NODE_PATH: "./:/opt/node_modules",
      },
    });

    table.grantReadWriteData(disconnectHandler);
    table.grantReadWriteData(gameHandler);

    let webSocketApi = new WebSocketApi(this, `${id}-web-socket-api`, {
      disconnectRouteOptions: {
        integration: new LambdaWebSocketIntegration({
          handler: disconnectHandler,
        }),
      },
    });

    const apiStage = new WebSocketStage(this, `${id}-stage`, {
      webSocketApi,
      stageName: "dev",
      autoDeploy: true,
    });

    webSocketApi.addRoute("game", {
      integration: new LambdaWebSocketIntegration({
        handler: gameHandler,
      }),
    });

    const connectionsArns = this.formatArn({
      service: "execute-api",
      resourceName: `${apiStage.stageName}/POST/*`,
      resource: webSocketApi.apiId,
    });

    gameHandler.addToRolePolicy(
      new PolicyStatement({
        actions: ["execute-api:ManageConnections"],
        resources: [connectionsArns],
      })
    );

    new CfnOutput(this, "WS API Url", {
      value: webSocketApi.apiId ?? "Something went wrong with the deploy",
    });
  }
}
