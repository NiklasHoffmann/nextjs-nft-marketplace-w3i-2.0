import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isNextRuntime = Boolean(process.env.NEXT_RUNTIME);
const enablePretty = !isProduction && !isNextRuntime;

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  ...(enablePretty
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
});
