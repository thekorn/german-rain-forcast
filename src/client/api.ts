import { getLogger } from '@logtape/logtape';
import { wsClient } from '@ws-kit/client/valibot';
import { createSignal } from 'solid-js';
import { ErrorMessage, Message } from '../shared/messages.ts';
import type { RainForecastResponse } from './forecast.ts';

const logger = getLogger(['german-rain-forecast', 'api']);

export async function fetchRainForecast(): Promise<RainForecastResponse> {
  const response = await fetch('/api/rain-forecast');

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new Error(
      detail ? `Rain forecast data is unavailable: ${detail}` : 'Rain forecast data is unavailable',
    );
  }

  return (await response.json()) as RainForecastResponse;
}

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

async function readErrorDetail(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { error?: { detail?: string; message?: string } };
    return body.error?.detail ?? body.error?.message;
  } catch {
    return undefined;
  }
}
