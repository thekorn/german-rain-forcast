import './logging.ts';
import { join } from 'node:path';
import { getLogger } from '@logtape/logtape';
import { PORT } from './env.ts';
import { createFakeRainForecastCache, forecastCache } from './forecast-cache.ts';
import {
  getRainForecastResponse,
  handleRainForecastApiRequest,
  type ForecastProvider,
} from './rain-forecast-api.ts';
import { renderStaticForecastPageFromFiles } from './static-page.ts';

const logger = getLogger(['german-rain-forecast', 'server']);

const PUBLIC_DIR = join(import.meta.dir, '../../dist/public');
const FAKE_DATA_FLAG = '--fake-data';
const SSR_FLAG = '--ssr';
const forecastProvider = Bun.argv.includes(FAKE_DATA_FLAG)
  ? createFakeRainForecastCache()
  : forecastCache;
const ssrMode = Bun.argv.includes(SSR_FLAG);

logger.debug('Public dir: {dir}', { dir: PUBLIC_DIR });
if (Bun.argv.includes(FAKE_DATA_FLAG)) {
  logger.warn('Using fake rain forecast data from command line flag {flag}', {
    flag: FAKE_DATA_FLAG,
  });
}
if (ssrMode) {
  logger.info('Serving SSR static page from command line flag {flag}', { flag: SSR_FLAG });
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

    if (ssrMode && staticPath === '/index.html') {
      return handleSsrPageRequest(PUBLIC_DIR, forecastProvider);
    }

    const file = Bun.file(join(PUBLIC_DIR, staticPath));

    if (await file.exists()) {
      return new Response(file);
    }

    const indexFile = Bun.file(join(PUBLIC_DIR, 'index.html'));
    if (!ssrMode && (await indexFile.exists())) {
      return new Response(indexFile);
    }

    if (ssrMode && (await indexFile.exists())) {
      return handleSsrPageRequest(PUBLIC_DIR, forecastProvider);
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

async function handleSsrPageRequest(
  publicDir: string,
  provider: ForecastProvider,
): Promise<Response> {
  try {
    const forecast = await getRainForecastResponse(provider);
    const html = await renderStaticForecastPageFromFiles(publicDir, forecast);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    logger.error('SSR page rendering failed: {error}', {
      error: error instanceof Error ? error.message : String(error),
    });

    return new Response('SSR page rendering failed', {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}
