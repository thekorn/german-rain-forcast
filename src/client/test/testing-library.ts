import { afterEach, expect } from 'bun:test';
import { cleanup } from '@solidjs/testing-library';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
