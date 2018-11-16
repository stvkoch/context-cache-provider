import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import XXH from 'xxhashjs'
import LRUMap from './lru'

const HASH_SEED = 121212
const LRU_LIMIT = 100

function getKey (name, args) {
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
export default function Provider ({
  children,
  context,
  initialItems = null,
  limit = LRU_LIMIT,
  externalResources = {},
  ...props
}) {
  const setTick = useState(void 0)[1]
  const [lru] = useState(() => {
    return new LRUMap(limit)
  })

  /**
   * Crear LRU cache, don't affect state, only clear the lru cache
   */
  function clearCache () {
    lru.clear()
  }

  /**
   * Return the resrouce function
   *
   * @param {String} name - resource name
   * @param {*} force - skip check if exist cache when resource run
   */
  function getResource (name, force = false) {
    return function () {
      const args = arguments
      const key = getKey(name, args)
      if (force || !lru.has(key)) {
        const resource = props[name] || externalResources[name]
        if (typeof resource === 'undefined') {
          throw Error(`Context:Cache:Provider ${name} resource is undefined`)
        }
        if (typeof resource.then === 'function') {
          const deffered = new Promise(function (resolve, reject) {
            return resource.apply(null, args).then(function () {
              resolve.apply(null, arguments)
            })
          }).then(function () {
            // first argument as resolved promise experct
            const newPromiseResource = {
              type: 'promise',
              status: 'resolved',
              args: arguments[0]
            }
            lru.set(key, newPromiseResource)
            setTick(void 0)
          })
          const promiseResource = {
            type: 'promise',
            status: 'pending',
            args: undefined
          }
          lru.set(key, promiseResource)
          setTick(void 0)
          throw deffered
        }

        if (typeof resource === 'function') {
          const response = resource.apply(null, args)
          const promiseResource = {
            type: 'function',
            status: 'resolved',
            args: response
          }
          lru.set(key, promiseResource)
          setTick(void 0)
          return undefined
        }

        return resource
      }
      const recoveryResource = lru.get(key)
      if (recoveryResource.status === 'resolved') {
        if (typeof recoveryResource.args === 'object') {
          return Object.values(recoveryResource.args)
        }
        return recoveryResource.args
      }
    }
  }

  function hit (name, ...args) {
    const key = getKey(name, args)
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
