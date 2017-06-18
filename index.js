'use strict';

const _get = require('hodash.get');

const ACTION = name => 'WATCH_VALUE_CHANGED' + (name ? `: ${name}` : '');

/**
 *
 */
module.exports = (store, config) => {
  return new StoreWatcher(store || globalConfig.store, config);
};


const globalConfig = {};
module.exports.configureGlobal = (config) => {
  globalConfig.store = config.store;
  globalConfig.shouldDispatch = config.shouldDispatch === true;
  globalConfig.shouldLog = config.shouldLog === true;
  globalConfig.requireName = config.requireName === true;
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
  constructor(store, config) {
    config = config || {};

    p(this).store = store;

    p(this).settings = {
      shouldDispatch: config.shouldDispatch === true,
      shouldLog: config.shouldLog === true,
      requireName: (config.requireName === true) || globalConfig.requireName
    };

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
   * config.checkEqual can optionally be passed if there is a need for something
   * other than strict equality.
   */
  watch(pathOrSelector, changeListener, config) {
    config = config || {};
    if (!pathOrSelector) throw new Error('StoreWatcher watch must be provided pathOrSelector.');
    if (!isFunction(changeListener)) throw new Error('StoreWatcher watch must be provided a function changeListener.');

    const handler = {
      changeListener,
      checkEqual: config.checkEqual,
      shouldDispatch: config.shouldDispatch,
      shouldLog: config.shouldLog,
      meta: {}
    };

    let name = config.name;
    // If we've been provided a string, we convert it to a selector.
    if (isString(pathOrSelector)) {
      const path = pathOrSelector;
      handler.meta.path = path;

      if (!name) name = path;
      const mapping = p(this).pathSelectorMapping;
      // Create or find existing selector for the given path.
      if (!mapping[path]) {
        // Create selector and add mapping of path to the selector to avoid
        // having to create multiple selectors if multiple parties interested in same path.
        mapping[path] = (state) => _get(state, path);
      }
      pathOrSelector = mapping[path];
    }

    if (!name && p(this).settings.requireName) throw new Error(`Redux Store Watch .watch defined without name while configured to requireName.`);
    handler.meta.name = name;

    const selector = pathOrSelector;
    handler.meta.selector = selector;
    handler.meta.selectorString = selector.toString();
    
    if (!p(this).watchedSelectors.get(selector)) {
      p(this).watchedSelectors.set(selector, []);
    }
    p(this).watchedSelectors.get(selector).push(handler);

    // Initialize current value of selector as previous value.
    if (config.initializeValue !== false)
        p(this).previousSelectorValues.set(selector, callSelector(selector, p(this).store.getState()));
  }


  /**
   * Unsubscribe from store.
   */
  remove() {
    p(this).unsubscribe();
  }


  /**
   *
   */
  getStore() {
    return p(this).store || globalConfig.store;
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
  p(this).watchedSelectors.forEach((handlers, selector) => {
    const currentValue = callSelector(selector, currentState);
    const previousValue = p(this).previousSelectorValues.get(selector);

    // Redefine previous selector's result to reflect current selector.
    p(this).previousSelectorValues.set(selector, currentValue);

    handlers.forEach(handler => {
      // Check whether or not the values are equal, using equality checker custom
      // to handler, else strict equality.
      const areEqual = handler.checkEqual ? handler.checkEqual(currentValue, previousValue) : (currentValue === previousValue);
      if (areEqual) return;

      const changeListener = handler.changeListener;
      const action = {type: ACTION(handler.meta.name), meta: handler.meta, previousValue, currentValue};
      if (handler.shouldDispatch || p(this).settings.shouldDispatch || globalConfig.shouldDispatch) p(this).store.dispatch(action);
      if (handler.shouldLog || p(this).settings.shouldLog || globalConfig.shouldLog) console.log(action);
      changeListener(currentValue, previousValue, currentState, previousState);
    });
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

function callSelector(selector, state) {
  try {
    return selector(state);
  }
  catch(err) {}
}
