import { join } from 'node:path';
import type { RainForecastResponse } from './rain-forecast-api.ts';

const STYLESHEET_TAG = '<link rel="stylesheet" href="/index.css" />';
const MAIN_SCRIPT_TAG = '<script type="module" src="/main.js"></script>';
const EMBEDDED_FORECAST_SCRIPT_ID = 'rain-forecast-data';

interface StaticPageAssets {
  indexHtml: string;
  css: string;
  js: string;
}

export async function renderStaticForecastPageFromFiles(
  publicDir: string,
  forecast: RainForecastResponse,
): Promise<string> {
  const [indexHtml, css, js] = await Promise.all([
    Bun.file(join(publicDir, 'index.html')).text(),
    Bun.file(join(publicDir, 'index.css')).text(),
    Bun.file(join(publicDir, 'main.js')).text(),
  ]);

  return renderStaticForecastPage({ indexHtml, css, js }, forecast);
}

export function renderStaticForecastPage(
  assets: StaticPageAssets,
  forecast: RainForecastResponse,
): string {
  if (!assets.indexHtml.includes(STYLESHEET_TAG)) {
    throw new Error('Static index.html is missing the index.css stylesheet tag');
  }

  if (!assets.indexHtml.includes(MAIN_SCRIPT_TAG)) {
    throw new Error('Static index.html is missing the main.js module script tag');
  }

  const forecastJson = escapeJsonForHtml(forecast);
  const inlineStyles = `<style data-ssr="index.css">\n${escapeStyleText(assets.css)}\n    </style>`;
  const inlineScript = `<script type="application/json" id="${EMBEDDED_FORECAST_SCRIPT_ID}">${forecastJson}</script>\n    <script type="module" data-ssr="main.js">\n${escapeScriptText(assets.js)}\n    </script>`;

  return assets.indexHtml
    .replace(STYLESHEET_TAG, inlineStyles)
    .replace(MAIN_SCRIPT_TAG, inlineScript);
}

function escapeJsonForHtml(value: unknown): string {
  return JSON.stringify(value)
    .replace(/&/g, '\\u0026')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function escapeStyleText(value: string): string {
  return value.replace(/<\/style/gi, '<\\/style');
}

function escapeScriptText(value: string): string {
  return value.replace(/<\/script/gi, '<\\/script');
}
