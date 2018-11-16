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
    return new LRUMap(LRU_LIMIT)
  })

  useEffect(() => {
    const lru = new LRUMap(limit)
    initialItems && lru.assign(initialItems)
    return lru
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
        const promise = new Promise(function (resolve, reject) {
          resource.apply(null, args).then(function () {
            resolve.apply(null, arguments)
          })
        })
        var promiseResource = {
          status: 'pending',
          args: undefined
        }
        promise.then(function () {
          const newData = { status: 'resolved', args: arguments }
          lru.set(key, newData)
          setTick(void 0)
        })
        lru.set(key, promiseResource)
        setTick(void 0)
        throw promise
      }

      const recoveryResource = lru.get(key)
      if (recoveryResource.status === 'resolved') {
        return recoveryResource.args[0]
      }
    }
  }

  return (
    <context.Provider value={{ getResource, clearCache }}>
      {children}
    </context.Provider>
  )
}

Provider.propTypes = {
  children: PropTypes.node.isRequired,
  context: PropTypes.object.isRequired,
  initialItems: PropTypes.any,
  limit: PropTypes.number,
  externalResources: PropTypes.object
}
