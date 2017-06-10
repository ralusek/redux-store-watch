### Watch paths on redux's store.

The objective of this utility is to watch specific paths on redux's store. All
paths's values are checked with strict equality. All data in a redux store
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

##### Using Redux component as example:
``` javascript
class MyComponent extends Component {
  componentWillMount() {
    this.watcher = watchStore(store);

    this.watcher('user.email', (current, previous, state) => {
      // store's `user.email` has changed

      // current is current value of user.email
      // previous is previous value of user.email
      // state is the full current state.
    });

    this.watcher('user.name', (current, previous, state) => {
      // store's `user.name` has changed
    });

    // We don't have to watch specific values, we can just watch for any changes
    // on store's `user` path. Note that this watcher would also be called if either
    // of the previous watchers were called, as if `user.email` or `user.name` has
    // changed on an immutable store, `user` has necessarily changed.
    this.watcher('user', (current, previous, state) => {
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
