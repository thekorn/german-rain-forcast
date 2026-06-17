import './logging.ts';
import { join } from 'node:path';
import { getLogger } from '@logtape/logtape';
import { PORT } from './env.ts';
import { createFakeRainForecastCache, forecastCache } from './forecast-cache.ts';
import { handleRainForecastApiRequest } from './rain-forecast-api.ts';

const logger = getLogger(['german-rain-forecast', 'server']);

const PUBLIC_DIR = join(import.meta.dir, '../../dist/public');
const FAKE_DATA_FLAG = '--fake-data';
const forecastProvider = Bun.argv.includes(FAKE_DATA_FLAG)
  ? createFakeRainForecastCache()
  : forecastCache;

logger.debug('Public dir: {dir}', { dir: PUBLIC_DIR });
if (Bun.argv.includes(FAKE_DATA_FLAG)) {
  logger.warn('Using fake rain forecast data from command line flag {flag}', {
    flag: FAKE_DATA_FLAG,
  });
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/api/rain-forecast') {
      if (req.method !== 'GET') {
        return new Response('Method not allowed', {
          status: 405,
          headers: {
            Allow: 'GET',
          },
        });
      }

      return handleRainForecastApiRequest(forecastProvider);
    }

    const staticPath = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = Bun.file(join(PUBLIC_DIR, staticPath));

    if (await file.exists()) {
      return new Response(file);
    }

    const indexFile = Bun.file(join(PUBLIC_DIR, 'index.html'));
    if (await indexFile.exists()) {
      return new Response(indexFile);
    }

    return new Response('Not found', { status: 404 });
  },
});
logger.info('Server running on http://localhost:{port}', { port: PORT });

forecastProvider.startBackgroundRefresh({
  onError(error) {
    logger.error('Forecast cache refresh failed: {error}', {
      error: error instanceof Error ? error.message : String(error),
    });
  },
});
