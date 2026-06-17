import { getLogger } from '@logtape/logtape';
import { wsClient } from '@ws-kit/client/valibot';
import { createSignal } from 'solid-js';
import { ErrorMessage, Message } from '../shared/messages.ts';

const logger = getLogger(['sample-project', 'api']);

export function createConnection() {
  const [error, setError] = createSignal<string | null>(null);
  const [connected, setConnected] = createSignal(false);

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${window.location.host}/ws`;

  const client = wsClient({
    url,
    reconnect: {
      enabled: true,
      maxAttempts: Infinity,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
    },
  });

  logger.info('Connecting to WebSocket at {url}', { url });

  client.onState((state) => {
    setConnected(state === 'open');
    logger.debug('WebSocket state changed to {state}', { state });
    if (state === 'open') {
      setError(null);
    }
  });

  client.on(Message, (msg) => {
    logger.info('Received message: {message}', { message: msg.payload });
  });

  client.on(ErrorMessage, (msg) => {
    logger.error('Server error: {message}', { message: msg.payload.message });
    setError(msg.payload.message);
  });

  client.onUnhandled((msg) => logger.warn('Unhandled WS message: {msg}', { msg }));

  client.connect();

  return {
    error,
    connected,
  };
}
