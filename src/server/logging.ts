import { configure, getConsoleSink, ansiColorFormatter } from '@logtape/logtape';
import { logLevel } from './env.ts';

await configure({
  sinks: {
    console: getConsoleSink({ formatter: ansiColorFormatter }),
  },
  loggers: [
    { category: ['sample-project'], lowestLevel: logLevel, sinks: ['console'] },
    { category: ['logtape', 'meta'], lowestLevel: 'warning', sinks: ['console'] },
  ],
});
