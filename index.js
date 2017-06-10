'use strict';

const _get = require('hodash.get');

/**
 *
 */
module.exports = (store) => {
  return new StoreWatcher(store);
};



// This establishes a private namespace.
const namespace = new WeakMap();
function p(object) {
  if (!namespace.has(object)) namespace.set(object, {});
  return namespace.get(object);
}



/**
 *
 */
class StoreWatcher {
  constructor(store) {
    p(this).store = store;

    p(this).watchPaths = {};
    p(this).previous = store.getState();

    p(this).unsubscribe = store.subscribe(() => {
      const state = p(this).store.getState();

      for (let path in changeListeners) {
        const changeListener = changeListeners[path];

        const previous = _get(p(this).previous, path);
        const current = _get(state, path);

        if (previous !== current) {
          changeListeners.forEach(changeListener => changeListener(current, previous, state));
        }
      }
    });
  }

  watch(path, changeListener) {
    if (!path || (typeof path !== 'string')) throw new Error(`StoreWatcher must be given a valid path to watch. Got: ${path}.`);
    p(this).watchPaths[path] = p(this).watchPaths[path] || [];
    p(this).watchPaths[path].push(changeListener);
  }

  remove() {
    p(this).unsubscribe();
  }
}
