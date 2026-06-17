import { configure, getConsoleSink } from '@logtape/logtape';
import { render } from 'solid-js/web';
import { Router } from '@solidjs/router';
import App from './App.tsx';

await configure({
  sinks: {
    console: getConsoleSink(),
  },
  loggers: [
    { category: ['sample-project'], lowestLevel: 'debug', sinks: ['console'] },
    { category: ['logtape', 'meta'], lowestLevel: 'warning', sinks: ['console'] },
  ],
});

const root = document.getElementById('app');
if (root) {
  render(() => <Router root={App} />, root);
}
