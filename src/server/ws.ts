import type { ServerWebSocket } from 'bun';
import { createRouter } from '@ws-kit/valibot';
import { createBunHandler } from '@ws-kit/bun';
import { getLogger } from '@logtape/logtape';
import { Message } from '../shared/messages.ts';

const logger = getLogger(['sample-project', 'ws']);

const router = createRouter();

router.on(Message, async (ctx) => {
  const ws = ctx.ws as ServerWebSocket<{ clientId: string }>;
  const clientId = ws.data.clientId;
  logger.debug('message received from {clientId}: {message}', {
    clientId,
    message: ctx.payload.message,
  });
});

export const { fetch: wsFetch, websocket } = createBunHandler(router, {
  onOpen({ data, ws: _ws }) {
    const clientId = data.clientId as string;
    logger.info('Client connected: {clientId}', { clientId });
  },
  onClose({ data, ws: _ws }) {
    const clientId = data.clientId as string;
    logger.info('Client disconnected: {clientId}', { clientId });
  },
});
