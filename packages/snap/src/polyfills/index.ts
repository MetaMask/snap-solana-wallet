import { install as installDOMExceptionPolyfill } from './dom-exception';
import { install as installEd25519Polyfill } from './ed25519';
import { install as installQueueMicrotaskPolyfill } from './queue-microtask';

/**
 * Installs all polyfills.
 */
export function installPolyfills() {
  installDOMExceptionPolyfill();
  installEd25519Polyfill();
  installQueueMicrotaskPolyfill();
}
