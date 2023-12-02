#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { Main } from "../lib/main";

const app = new App();
new Main(app, "four-backend", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
