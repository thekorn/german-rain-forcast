import './logging.ts';
import { join } from 'node:path';
import { getLogger } from '@logtape/logtape';
import { PORT } from './env.ts';
import { wsFetch, websocket } from './ws.ts';

const logger = getLogger(['sample-project', 'server']);

const PUBLIC_DIR = join(import.meta.dir, '../../dist/public');

logger.debug('Public dir: {dir}', { dir: PUBLIC_DIR });

Bun.serve({
  port: PORT,
  async fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === '/ws') {
      return wsFetch(req, server);
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
  websocket,
});
logger.info('Server running on http://localhost:{port}', { port: PORT });
