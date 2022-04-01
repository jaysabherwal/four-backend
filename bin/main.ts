#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { Main } from '../lib/main';

const app = new cdk.App();
new Main(app, 'four-backend');
