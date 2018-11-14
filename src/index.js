import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

import XXH from "xxhashjs";

import LRUMap from "./lru";

const HASH_SEED = "notsecurity";
const LRU_LIMIT = 500;

const lru = new LRUMap(LRU_LIMIT);

function getKey(name, args) {
  return XXH.h32(JSON.stringify(arguments), HASH_SEED).toString(16);
}

export default function Provider({
                                   children,
                                   context,
                                   initialItems,
                                   externalResources,
                                   ...props
                                 }) {
  const setTick = useState(void 0)[1];

  useEffect(() => initialItems && lru.assign(initialItems));

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
          promise,
          args: undefined
        };

        promise.then(function() {
          const newData = { status: "resolved", args: arguments };
          lru.set(key, newData);
          setTick(void 0);
        });
        lru.set(key, promiseResource);
        setTick(void 0);
        throw promiseResource.promise;
      }

      const recoveryResource = lru.get(key);
      if (recoveryResource.status === "resolved") {
        return recoveryResource.args[0];
      }
    };
  }

  return (
    <context.Provider value={{ getResource }}>{children}</context.Provider>
  );
}


PropTypes.propTypes = {
  children: PropTypes.node,
  context: PropTypes.object.isRequired,
  initialItems: PropTypes.object,
  externalResources: PropTypes.object
};


PropTypes.defaultProps = {
  initialItems: null,
  externalResources: {}
};
