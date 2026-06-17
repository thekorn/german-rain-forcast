#!/usr/bin/env node

import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { connect } from './cdp.js';

const DEBUG = process.env.DEBUG === '1';
const log = DEBUG ? (...args) => console.error('[debug]', ...args) : () => {};
const argv = process.argv.slice(2);

function parseDelay(args) {
  let delayMs = 0;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      console.log('Usage: ./scripts/screenshot.js [--delay <ms>]');
      process.exit(0);
    }
    if (arg === '--delay' || arg === '-d') {
      const value = args[i + 1];
      if (!value) throw new Error('Missing value for --delay');
      delayMs = Number(value);
      if (!Number.isFinite(delayMs) || delayMs < 0) {
        throw new Error(`Invalid --delay value: ${value}`);
      }
      i++;
      continue;
    }
  }
  return delayMs;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const delayMs = parseDelay(argv);
const timeoutMs = 15000 + delayMs;

// Global timeout
const globalTimeout = setTimeout(() => {
  console.error(`✗ Global timeout exceeded (${Math.ceil(timeoutMs / 1000)}s)`);
  process.exit(1);
}, timeoutMs);

try {
  log('connecting...');
  const cdp = await connect(5000);

  log('getting pages...');
  const pages = await cdp.getPages();
  const page = pages.at(-1);

  if (!page) {
    console.error('✗ No active tab found');
    process.exit(1);
  }

  log('attaching to page...');
  const sessionId = await cdp.attachToPage(page.targetId);

  if (delayMs > 0) {
    log(`waiting ${delayMs}ms before screenshot...`);
    await sleep(delayMs);
  }

  log('taking screenshot...');
  const data = await cdp.screenshot(sessionId);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `screenshot-${timestamp}.png`;
  const filepath = join(tmpdir(), filename);

  writeFileSync(filepath, data);
  console.log(filepath);

  log('closing...');
  cdp.close();
  log('done');
} catch (e) {
  console.error('✗', e.message);
  process.exit(1);
} finally {
  clearTimeout(globalTimeout);
  setTimeout(() => process.exit(0), 100);
}
