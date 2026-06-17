import { plugin } from 'bun';
import { transformSync } from '@babel/core';
import presetTypescript from '@babel/preset-typescript';
import presetSolid from 'babel-preset-solid';
import { resolve } from 'node:path';

const solidWebClient = resolve(import.meta.dir, '../../../node_modules/solid-js/web/dist/web.js');
const solidClient = resolve(import.meta.dir, '../../../node_modules/solid-js/dist/solid.js');

await plugin({
  name: 'solid-jsx',
  async setup(build) {
    build.onResolve({ filter: /^solid-js\/web$/ }, () => {
      return { path: solidWebClient };
    });

    build.onResolve({ filter: /^solid-js$/ }, () => {
      return { path: solidClient };
    });

    build.onLoad({ filter: /\.tsx$/ }, async (args) => {
      const file = Bun.file(args.path);
      const code = await file.text();

      const result = transformSync(code, {
        filename: args.path,
        presets: [presetTypescript, presetSolid],
      });

      return {
        contents: result?.code ?? '',
        loader: 'js',
      };
    });
  },
});
