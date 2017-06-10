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

    p(this).watchedSelectors = new Map();

    // Mapping paths to their selectors.
    p(this).pathSelectorMapping = {};


    // We store the previous state. Because the state should be immutable, this
    // means we're only keeping at minimum a single object reference in memory,
    // whereas most others remain unchanged references between states.
    // This is used for diffing given paths.
    p(this).previousState = store.getState();

    // For selectors, we must store the previous results found for a given
    // selector keyed by the selector itself.
    p(this).previousSelectorValues = new WeakMap();


    // Bind Private methods.
    p(this).handleSelectorChanges = handleSelectorChanges.bind(this);


    // Subscribe to store.
    p(this).unsubscribe = store.subscribe(() => {
      const currentState = p(this).store.getState();
      const previousState = p(this).previousState;

      // Redefine previous state as current state.
      p(this).previousState = currentState;

      // On store action, handle changes to watched store selector.
      p(this).handleSelectorChanges(currentState, previousState);
    });
  }


  /**
   * Watch a given string path or a selector's values on store action. Strict
   * equality is used under the assumption that immutable store is employed.
   */
  watch(pathOrSelector, changeListener) {
    if (!pathOrSelector) throw new Error('StoreWatcher watch must be provided pathOrSelector.');
    if (!isFunction(changeListener)) throw new Error('StoreWatcher watch must be provided a function changeListener.');

    // If we've been provided a string, we convert it to a selector.
    if (isString(pathOrSelector)) {
      const path = pathOrSelector;
      const mapping = p(this).pathSelectorMapping;
      // Create or find existing selector for the given path.
      if (!mapping[path]) {
        // Create selector and add mapping of path to the selector to avoid
        // having to create multiple selectors if multiple parties interested in same path.
        mapping[path] = (state) => _get(state, path);
      }
      pathOrSelector = mapping[path];
    }

    if (isFunction(pathOrSelector)) {
      const selector = pathOrSelector;
      if (!p(this).watchedSelectors.get(selector)) {
        p(this).watchedSelectors.set(selector, []);
      }
      p(this).watchedSelectors.get(selector).push(changeListener);
      // Set selector result as previous selector value.
      p(this).previousSelectorValues.set(selector, selector());
    }
  }


  /**
   * Unsubscribe from store.
   */
  remove() {
    p(this).unsubscribe();
  }
}


// Private methods.

/**
 * Check for change between previous selector result and current selector result.
 * Something of note is that the previous state value is explicitly saved, even
 * though it could just be checked again by selecting from the previousState.
 * The reason this is is because it is a very small memory footprint, likely
 * just reference to a part of the state already in memory, which provides the
 * additional benefit of letting your selector reference some other arbitrary
 * state. If all you care about is checking if something has changed since then,
 * you may do so.
 */
function handleSelectorChanges(currentState, previousState) {
  p(this).watchedSelectors.forEach((changeListeners, selector) => {
    const currentValue = selector(currentState);
    const previousValue = p(this).previousSelectorValues.get(selector);

    // Redefine previous selector's result to reflect current selector.
    p(this).previousSelectorValues.set(selector, currentValue);

    if (previousValue !== currentValue) {
      changeListeners.forEach(changeListener => {
        changeListener(currentValue, previousValue, currentState, previousState);
      });
    }
  });
}



// Utilities.
const asString = Object.prototype.toString;

function isString(subject) {
  return asString.call(subject) == '[object String]';
}

function isFunction(subject) {
  return asString.call(subject) == '[object Function]';
}
