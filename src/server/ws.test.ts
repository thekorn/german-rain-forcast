import { describe, expect, test } from 'bun:test';
import { wsFetch, websocket } from './ws.ts';

describe('WebSocket handler', () => {
  test('exports fetch adapter and websocket options', () => {
    expect(typeof wsFetch).toBe('function');
    expect(websocket).toBeDefined();
  });
});
