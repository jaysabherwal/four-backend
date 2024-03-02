import { expect as expectCDK, haveResourceLike } from "@aws-cdk/assert";
import { Main } from "../lib/main";
import { App } from "aws-cdk-lib";
import '@types/jest';

describe("DynamoDB Created", () => {
  const app = new App();
  // WHEN
  const stack = new Main(app, "MyTestStack");
  // THEN
  expectCDK(stack).to(
    haveResourceLike("AWS::DynamoDB::Table", {
      TableName: 'four-games',
      KeySchema: [
        {
          AttributeName: "id",
          KeyType: "HASH"
        }
      ],
    })
  );
});

describe("Game Lambda Created", () => {
  const app = new App();
  // WHEN
  const stack = new Main(app, "MyTestStack");
  // THEN
  expectCDK(stack).to(
    haveResourceLike("AWS::Lambda::Function", {
      FunctionName: 'four-game-function',
      Timeout: 60,
      Handler: "game/index.handler",
      Runtime: "nodejs18.x",
    })
  );
});

describe("Disconnect Lambda Created", () => {
  const app = new App();
  // WHEN
  const stack = new Main(app, "MyTestStack");
  // THEN
  expectCDK(stack).to(
    haveResourceLike("AWS::Lambda::Function", {
      FunctionName: 'four-disconnect-function',
      Timeout: 60,
      Handler: "disconnect/index.handler",
      Runtime: "nodejs18.x",
    })
  );
});

describe("API Gateway Http API Created", () => {
  const app = new App();
  // WHEN
  const stack = new Main(app, "MyTestStack");
  // THEN
  expectCDK(stack).to(
    haveResourceLike("AWS::ApiGatewayV2::Api", {
      ProtocolType: "WEBSOCKET",
    })
  );
});
