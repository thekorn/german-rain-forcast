import { configure, getConsoleSink, ansiColorFormatter, getLogger } from '@logtape/logtape';
import { transformSync } from '@babel/core';
import { cpSync, mkdirSync, watch } from 'node:fs';

await configure({
  sinks: { console: getConsoleSink({ formatter: ansiColorFormatter }) },
  loggers: [
    { category: ['german-rain-forecast', 'build'], sinks: ['console'], lowestLevel: 'debug' },
    { category: ['logtape', 'meta'], lowestLevel: 'warning', sinks: ['console'] },
  ],
});

const logger = getLogger(['german-rain-forecast', 'build']);

const solidPlugin: import('bun').BunPlugin = {
  name: 'solid-jsx',
  setup(build) {
    build.onLoad({ filter: /\.tsx$/ }, async (args) => {
      const code = await Bun.file(args.path).text();
      const result = transformSync(code, {
        filename: args.path,
        presets: ['@babel/preset-typescript', 'babel-preset-solid'],
      });
      return {
        contents: result?.code ?? '',
        loader: 'js',
      };
    });
  },
};

async function build(): Promise<boolean> {
  const start = performance.now();

  mkdirSync('dist/public', { recursive: true });

  const result = await Bun.build({
    entrypoints: ['src/client/main.tsx'],
    outdir: 'dist/public',
    minify: process.env.NODE_ENV === 'production',
    naming: '[name].[ext]',
    target: 'browser',
    plugins: [solidPlugin],
  });

  if (!result.success) {
    logger.error('Build failed: {logs}', { logs: result.logs });
    return false;
  }

  cpSync('src/client/index.html', 'dist/public/index.html');
  cpSync('src/client/public', 'dist/public', { recursive: true });

  const elapsed = (performance.now() - start).toFixed(0);
  logger.info('Build done in {elapsed}ms', { elapsed });
  return true;
}

await build();

if (process.argv.includes('--watch')) {
  logger.info('Watching for changes...');

  let timer: Timer | null = null;
  function scheduleRebuild(filename: string | null) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      logger.info('{filename} changed, rebuilding...', { filename: filename ?? 'file' });
      await build();
    }, 50);
  }

  watch('src/client', { recursive: true }, (_event, filename) => {
    scheduleRebuild(filename);
  });

  watch('src/client/index.html', () => {
    scheduleRebuild('index.html');
  });

  await new Promise(() => {});
}
