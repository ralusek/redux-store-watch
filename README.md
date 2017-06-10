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


##### Define the Mapping.
``` javascript
const mapping = {
  age: 'Age',
  name: obj => obj.FirstName + ' ' + obj.LastName,
  address: obj => reshape({
    street: 'Address.Street',
    coords: reshape({
      lat: 'Address.Lat',
      lng: 'Address.Long'
    }, obj)
  }, obj)
};
```
The properties of the `mapping` object are in the shape that our output will take on. By having a property on the mapping object, such as `age` or `name`, you are defining what you would like a property keyed as in your output. The value of the mapping function can be one of three types: `function`, `string`, or `other`.

- `function`: If the value on the mapping is a function, such as with `name`, the whole object we are mapping from will be passed in. The function is executed in a `try` `catch` block, so you can be very aggressive with reaching for properties. `obj => Math.floor(obj.age.median)` is fine to do even if you don't know if `obj.age` or `obj.age.median` are defined, let alone whether or not `Math.floor` will throw an error. If it throws an error, it will be caught, and the value will be undefined.
- `string`: A dot-delimited path to the value you're looking for. `'address.street'` will safely attempt to return `obj.address.street`, and return undefined if there is anything undefined along the way.
- `other`: Just places the value encountered in the output at that property. (See `mapping.address.coords` for reference)

##### The target object we'd like to map from.
``` javascript
const data = {
  Age: 25,
  FirstName: 'Tom',
  LastName: 'Bingus',
  Address: {
    Street: '1234 Dangus St',
    Lat: 123,
    Long: 10
  }
};
```


##### Execute function.
``` javascript
_reshape(mapping, data);
```

##### The output.
``` json
{
  "age": 25,
  "name": "Tom Bingus",
  "address": {
    "street": "1234 Dangus St",
    "coords": {
      "lat": 123,
      "lng": 10
    }
  }
}
```
