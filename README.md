### Watch paths on redux's store.

The objective of this utility is to watch specific paths on redux's store. This
is achieved by either providing a `selector` function whose results will be
compared between current and previous state, or a string path whose value will
be checked on the current and previous state.
All differences are checked with strict equality. All data in a redux store
should be edited immutably, which removes the need for anything but a strict
equality check.

`$ npm install --save redux-store-watch`


##### Include the package.

``` javascript
import watchStore from 'redux-store-watch';
```
or
``` javascript
const watchStore = require('redux-store-watch');
```

##### Import your redux store. Assume imported as `store`.

### Using Redux component as example:

##### Here is how we would watch some string path's on the store.
``` javascript
class MyComponent extends Component {
  componentWillMount() {
    this.watcher = watchStore(store);

    this.watcher('user.email', (currentValue, previousValue, currentState, previousState) => {
      // store's `user.email` has changed

      // current is current value of user.email
      // previous is previous value of user.email
      // state is the full current state.
    });

    this.watcher('user.name', (currentValue, previousValue, currentState, previousState) => {
      // store's `user.name` has changed
    });

    // We don't have to watch specific values, we can just watch for any changes
    // on store's `user` path. Note that this watcher would also be called if either
    // of the previous watchers were called, as if `user.email` or `user.name` has
    // changed on an immutable store, `user` has necessarily changed.
    this.watcher('user', (currentValue, previousValue, currentState, previousState) => {
      // store's `user` has changed
    });
  }

  componentWillUnmount() {
    // We unsubscribe from the store. If you do not do this, in the same way as
    // if you had no unsubscribed from redux, the callbacks would continue to
    // be called even if the component were no longer mounted. 
    this.watcher.remove();
  }
}
```

##### Here is how we would watch the results of a selector.
``` javascript
class MyComponent extends Component {
  componentWillMount() {
    this.watcher = watchStore(store);

    // Let's say this is my selector, could be defined in another file. The
    // selector will always be provided the current state as an argument.
    const userEmailSelector = state => state.user.email;

    this.watcher(userEmailSelector, (currentValue, previousValue, currentState, previousState) => {
      // results of userEmailSelector has changed

      // current is current value of the selector's result
      // previous is previous value of selector's result
      // state is the full current state.
    });


    // If you have a selector that requires specific arguments be passed in,
    // you can simply wrap the selector in a closure.

    // Say that this was my selector.
    const userValueSelector = (prop, state) =>  state.user[prop];

    // Because my selector is expecting something different than just the `state`
    // argument passed in by the watcher, I can just wrap it in a function.
    this.watcher(state => userValueSelector('email', state), (currentValue, previousValue, currentState, previousState) => {
      // results of userValueSelector('email')
    });


    // As a last example, each selector's result is actually stored since the last
    // change, so you could really put whatever you want as a function whose
    // result you'd like to compare to last time a redux action was dispatched.
    this.watcher(state => Math.random(), (currentValue, previousValue, currentState, previousState) => {
      // A random number was different than the last time an action was dispatched...
      // Absolutely fascinating.
    });
  }

  componentWillUnmount() {
    this.watcher.remove();
  }
}
```
