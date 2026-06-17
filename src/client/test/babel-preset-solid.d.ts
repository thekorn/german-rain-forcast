declare module 'babel-preset-solid' {
  import type { PresetAPI, PresetObject } from '@babel/core';
  const preset: (api: PresetAPI, options: object, dirname: string) => PresetObject;
  export default preset;
}
