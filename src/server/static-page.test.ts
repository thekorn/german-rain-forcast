import { describe, expect, test } from 'bun:test';
import { renderStaticForecastPage } from './static-page.ts';
import type { RainForecastResponse } from './rain-forecast-api.ts';

describe('static SSR page', () => {
  test('puts stylesheet, client script, and forecast data into the static page', () => {
    const html = renderStaticForecastPage(
      {
        indexHtml: `<!doctype html>
<html lang="de">
  <head>
    <link rel="stylesheet" href="/index.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>`,
        css: 'body { color: red; }',
        js: 'console.log("ready")',
      },
      createForecast(),
    );

    expect(html).toContain('<style data-ssr="index.css">\nbody { color: red; }');
    expect(html).not.toContain('<link rel="stylesheet" href="/index.css" />');
    expect(html).toContain('<script type="application/json" id="rain-forecast-data">');
    expect(html).toContain('"times":["2026-06-17T09:00:00"]');
    expect(html).toContain('<script type="module" data-ssr="main.js">\nconsole.log("ready")');
    expect(html).not.toContain('<script type="module" src="/main.js"></script>');
  });

  test('escapes embedded content that could close html tags early', () => {
    const html = renderStaticForecastPage(
      {
        indexHtml:
          '<link rel="stylesheet" href="/index.css" /><script type="module" src="/main.js"></script>',
        css: '</style><script>alert(1)</script>',
        js: '</script><script>alert(1)</script>',
      },
      {
        ...createForecast(),
        refresh: {
          status: 'fresh',
          lastError: '</script><script>alert(1)</script>',
        },
      },
    );

    expect(html).toContain('<\\/style>');
    expect(html).toContain('<\\/script>');
    expect(html).toContain(
      '\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e',
    );
  });
});

function createForecast(): RainForecastResponse {
  return {
    model: 'dwd-icon',
    timezone: 'Europe/Berlin',
    times: ['2026-06-17T09:00:00'],
    units: {
      precipitation: 'mm',
    },
    gridPoints: [{ latitude: 47, longitude: 6 }],
    precipitation: [[1]],
    cache: {
      updatedAt: '2026-06-17T08:00:00.000Z',
      expiresAt: '2026-06-17T09:00:00.000Z',
      ttlMs: 60 * 60 * 1000,
    },
    refresh: {
      status: 'fresh',
    },
  };
}
