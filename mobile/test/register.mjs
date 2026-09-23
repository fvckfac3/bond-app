// Node test setup: the app's modules use extensionless relative imports (resolved by
// Metro in the app). Teach Node's ESM resolver to try `.js` for those in tests.
import { register } from 'node:module';

register('./resolve-extensionless.mjs', import.meta.url);
