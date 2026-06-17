import type { LogLevel } from '@logtape/logtape';

import { Config, ConfigProvider, Effect } from 'effect';

const appConfig = Config.all({
  logLevel: Config.withDefault(
    Config.literal('debug', 'info', 'warning', 'error', 'fatal')('LOG_LEVEL'),
    'info' as const,
  ),
  PORT: Config.withDefault(Config.integer('PORT'), 3000),
});

const resolved = Effect.runSync(Effect.withConfigProvider(appConfig, ConfigProvider.fromEnv()));

export const logLevel: LogLevel = resolved.logLevel;
export const PORT = resolved.PORT;
