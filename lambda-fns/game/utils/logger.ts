import pino from "pino";

export const logger = pino({
  name: 'four-backend',
  level: 'debug'
});