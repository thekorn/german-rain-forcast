import type { RouteSectionProps } from '@solidjs/router';
import { describe, expect, mock, test } from 'bun:test';
import { createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';

const stubRouteProps: RouteSectionProps = {
  params: {},
  location: {
    pathname: '/',
    search: '',
    hash: '',
    query: {},
    state: null,
    key: 'test',
  },
  data: undefined,
};

mock.module('./api.ts', () => ({
  createConnection: () => {
    const [error] = createSignal<string | null>(null);
    const [connected] = createSignal(false);
    return { error, connected };
  },
}));

const App = (await import('./App.tsx')).default;

describe('App', () => {
  test('renders hello world', () => {
    render(() => <App {...stubRouteProps} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
});
