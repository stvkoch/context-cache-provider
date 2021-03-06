import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import XXH from 'xxhashjs'
import LRUMap from './lru'

const HASH_SEED = 121212
const LRU_LIMIT = 100

function getKey() {
  return XXH.h32(JSON.stringify(arguments), HASH_SEED).toString(16)
}

/**
 * @name Provider
 *
 * @description
 *  Each Provider have your own cache object, what means that you
 *  could have same resource name for differents cahce providers
 *
 * @example
 * <Provider context={userContext} fetchList={fetchUserList} fetchItem={fetchUserItem}>
 *  ...
 * </Provider>
 */
export default function Provider({
  children,
  context,
  initialItems = null,
  limit = LRU_LIMIT,
  externalResources = {},
  ...props
}) {
  const [lru] = useState(() => {
    return new LRUMap(limit)
  })

  /**
   * Crear LRU cache, don't affect state, only clear the lru cache
   */
  function clearCache() {
    lru.clear()
  }

  /**
   * Return the resrouce function
   *
   * @param {String} name - resource name
   * @param {*} force - skip check if exist cache when resource run
   */
  function getResource(name, force = false) {
    // Return HOF that will delivery new promise where will try
    // resolve or run the previous configurated resource
    return function() {
      const args = arguments
      const key = getKey(name, args)
      const recoveredResourceIdentity = lru.get(key)
      if (force || recoveredResourceIdentity === undefined) {
        const resource = props[name] || externalResources[name]

        if (typeof resource !== 'function') {
          throw Error(
            `Context:Cache:Provider ${name} resource is not a function `
          )
        }

        const deffered = new Promise(function(resolve, reject) {
          const resultResource = resource.apply(null, args)

          if (typeof resultResource.then === 'function') {
            return resultResource
              .then(function() {
                resolve.apply(null, arguments)
              })
              .catch(e => {
                reject(e)
              })
          }

          return resolve(resultResource)
        })

        const promiseResource = {
          status: 'pending',
          args: undefined
        }
        lru.set(key, promiseResource)

        deffered
          .then(function(result) {
            const newPromiseResource = {
              status: 'resolved',
              args: result
            }
            lru.set(key, newPromiseResource)
          })
          .catch(function(e) {
            const newPromiseResource = {
              status: 'rejected',
              args: e.toString()
            }
            lru.set(key, newPromiseResource)
          })

        throw deffered
      }

      return recoveredResourceIdentity.args
    }
  }

  function hit(name, ...args) {
    const key = getKey(name, Object.assign({}, args))
    return lru.has(key)
  }

  return (
    <context.Provider value={{ getResource, clearCache, hit }}>
      {children}
    </context.Provider>
  )
}

Provider.propTypes = {
  children: PropTypes.any.isRequired,
  context: PropTypes.object.isRequired,
  initialItems: PropTypes.any,
  limit: PropTypes.number,
  externalResources: PropTypes.object
}
