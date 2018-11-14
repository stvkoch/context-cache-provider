import React, { useState, useEffect } from "react";
import LRUMap from "./lru";
import XXH from "xxhashjs";

const hashSeed = "notsecurity";
const lru = new LRUMap(100);

function getKey(name, args) {
  return XXH.h32(JSON.stringify(arguments), hashSeed).toString(16);
}

export default function Provider({
                                   children,
                                   context,
                                   initialItems = null,
                                   externalResources = {},
                                   ...props
                                 }) {
  const setTick = useState(void 0)[1];

  useEffect(() => initialItems && lru.assign(initialItems));
  function clearCache() {
    lru.clear();
  }
  function getResource(name, force = false) {
    return function() {
      const args = arguments;
      const key = getKey(name, args);

      if (force || !lru.has(key)) {
        const resource = props[name] || externalResources[name];
        const promise = new Promise(function(resolve, reject) {
          resource.apply(null, args).then(function() {
            resolve.apply(null, arguments);
          });
        });

        var promiseResource = {
          status: "pending",
          // promise,
          args: undefined
        };

        promise.then(function() {
          const newData = { status: "resolved", args: arguments };
          lru.set(key, newData);
          setTick(void 0);
        });

        lru.set(key, promiseResource);
        setTick(void 0);
        // throw promiseResource.promise;
        throw promise;
      }

      const recoveryResource = lru.get(key);
      if (recoveryResource.status === "resolved") {
        return recoveryResource.args[0];
      }
    };
  }

  return (
    <context.Provider value={{ getResource, clearCache }}>
      {children}
    </context.Provider>
  );
}
