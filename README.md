# context-cache-provider



_Alert! This package is using experimental React features._

 
> 

[![NPM](https://img.shields.io/npm/v/context-cache-provider.svg)](https://www.npmjs.com/package/context-cache-provider) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)


Use React context to cache data and manager fetch resources on React Applications.

In example folder you will see a complete application example using hooks and zero class components. 


## Install

```bash
npm install --save context-cache-provider
```

## Usage


Setting the react-context-cache provider

```jsx
import React, { createContext} from 'react'
import Provider from 'context-cache-provider'

const context = createContext();
export context;

function fetchItems(query = {}) {
  return fetch('http://apiserver.io', {
            body: JSON.stringify(query)
         }).then(response => response.json());
}

export default function ProviderItems({children}) {
  return <Provider context={context} fetchItems={fetchItems}>
    {children}
   </Provider>;
}
```

Using the context to bring resources inside of your components 


```jsx

import React, { Suspense, useContext } from 'react'

import {context} from './provider-items'

export default function ListItems() {
  const { getResource } = useContext(context);
  
  function renderList() {
    const data = getResource('fetchItems')();
    return <ul>
      {data.map(item => <li>{item.title}</li>}
     </ul>;
  }
  
  
  return <Suspense fallback={<div>Loading...</div>}>
    {renderList()}
   </Suspense>;
}
```

You can have many Providers you want each one with your own resources.

## Api

### getResource


```
getResource(resourceName:String, invalidateCacheItem:Boolean):Function
```


## Knowledge
 
#### Provider

Provider is a cache component using context that map resources.

When you get resource and call him, the provider will throw the
promise returned by resource, then react will suspense the render
if your component was wrapper by Suspense React Component. 
   

#### Context

It's a component where you can bring resources to your components


#### Resources

It's a function that return a promise or an observable.


## Run example


![Imgur](https://i.imgur.com/t3jPG31.gifv)


To run example you should install all deps.

```
cd example
yarn
yarn start
```



## License

MIT © [stvkoch](https://github.com/stvkoch)
