import React, { useState } from 'react';
import PropTypes from 'prop-types';
import XXH from 'xxhashjs';

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var objectWithoutProperties = function (obj, keys) {
  var target = {};

  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }

  return target;
};

var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

var NEWER = Symbol('N');
var OLDER = Symbol('O');

/**
 * https://github.com/stereobooster/lru_map/blob/stereobooster/index.js
 *
 * A doubly linked list-based Least Recently Used (LRU) cache. Will keep most
 * recently used items while discarding least recently used items when its limit
 * is reached.
 *
 * Licensed under MIT. Copyright (c) 2010 Rasmus Andersson <http://hunch.se/>
 * See README.md for details.
 *
 * Illustration of the design:
 *
 *       entry             entry             entry             entry
 *       ______            ______            ______            ______
 *      | head |.newer => |      |.newer => |      |.newer => | tail |
 *      |  A   |          |  B   |          |  C   |          |  D   |
 *      |______| <= older.|______| <= older.|______| <= older.|______|
 *
 *  removed  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  added
 */

var LRUMap = function () {
  function LRUMap(limit, entries) {
    classCallCheck(this, LRUMap);

    this.size = 0;
    this.limit = limit;
    this.oldest = this.newest = undefined;
    this.map = new Map();

    if (entries) {
      this.assign(entries);
      if (limit < 1) {
        this.limit = this.size;
      }
    }
  }

  createClass(LRUMap, [{
    key: '_bump',
    value: function _bump(entry) {
      if (entry === this.newest) {
        // Already the most recenlty used entry, so no need to update the list
        return;
      }
      // HEAD--------------TAIL
      //   <.older   .newer>
      //  <--- add direction --
      //   A  B  C  <D>  E
      if (entry[NEWER]) {
        if (entry === this.oldest) {
          this.oldest = entry[NEWER];
        }
        entry[NEWER][OLDER] = entry[OLDER]; // C <-- E.
      }
      if (entry[OLDER]) {
        entry[OLDER][NEWER] = entry[NEWER]; // C. --> E
      }
      entry[NEWER] = undefined; // D --x
      entry[OLDER] = this.newest; // D. --> E
      if (this.newest) {
        this.newest[NEWER] = entry; // E. <-- D
      }
      this.newest = entry;
    }
  }, {
    key: 'get',
    value: function get$$1(key) {
      // First, find our cache entry
      var entry = this.map.get(key);
      if (!entry) return; // Not cached. Sorry.
      // As <key> was found in the cache, register it as being requested recently
      this._bump(entry);
      return entry.value;
    }
  }, {
    key: 'set',
    value: function set$$1(key, value) {
      var entry = this.map.get(key);

      if (entry) {
        // update existing
        entry.value = value;
        this._bump(entry);
        return this;
      }

      // new entry
      this.map.set(key, entry = { key: key, value: value });

      if (this.newest) {
        // link previous tail to the new tail (entry)
        this.newest[NEWER] = entry;
        entry[OLDER] = this.newest;
      } else {
        // we're first in -- yay
        this.oldest = entry;
      }

      // add new entry to the end of the linked list -- it's now the freshest entry.
      this.newest = entry;
      ++this.size;
      if (this.size > this.limit) {
        // we hit the limit -- remove the head
        this.shift();
      }

      return this;
    }
  }, {
    key: 'shift',
    value: function shift() {
      // todo: handle special case when limit == 1
      var entry = this.oldest;
      if (entry) {
        if (this.oldest[NEWER]) {
          // advance the list
          this.oldest = this.oldest[NEWER];
          this.oldest[OLDER] = undefined;
        } else {
          // the cache is exhausted
          this.oldest = undefined;
          this.newest = undefined;
        }
        // Remove last strong reference to <entry> and remove links from the purged
        // entry being returned:
        entry[NEWER] = entry[OLDER] = undefined;
        this.map.delete(entry.key);
        --this.size;
        return [entry.key, entry.value];
      }
    }
  }, {
    key: 'has',
    value: function has(key) {
      return this.map.has(key);
    }
  }, {
    key: 'assign',
    value: function assign(entries) {
      var entry = void 0;
      var limit = this.limit || Number.MAX_VALUE;
      this.map.clear();
      var it = entries[Symbol.iterator]();
      for (var itv = it.next(); !itv.done; itv = it.next()) {
        var e = { key: itv.value[0], value: itv.value[1] };
        this.map.set(e.key, e);
        if (!entry) {
          this.oldest = e;
        } else {
          entry[NEWER] = e;
          e[OLDER] = entry;
        }
        entry = e;
        if (limit-- === 0) {
          throw new Error('overflow');
        }
      }
      this.newest = entry;
      this.size = this.map.size;
    }
  }, {
    key: 'clear',
    value: function clear() {
      // Not clearing links should be safe, as we don't expose live links to user
      this.oldest = this.newest = undefined;
      this.size = 0;
      this.map.clear();
    }
  }]);
  return LRUMap;
}();

var HASH_SEED = 121212;
var LRU_LIMIT = 100;

function getKey() {
  return XXH.h32(JSON.stringify(arguments), HASH_SEED).toString(16);
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
function Provider(_ref) {
  var children = _ref.children,
      context = _ref.context,
      _ref$initialItems = _ref.initialItems,
      _ref$limit = _ref.limit,
      limit = _ref$limit === undefined ? LRU_LIMIT : _ref$limit,
      _ref$externalResource = _ref.externalResources,
      externalResources = _ref$externalResource === undefined ? {} : _ref$externalResource,
      props = objectWithoutProperties(_ref, ['children', 'context', 'initialItems', 'limit', 'externalResources']);

  var _useState = useState(function () {
    return new LRUMap(limit);
  }),
      _useState2 = slicedToArray(_useState, 1),
      lru = _useState2[0];

  /**
   * Crear LRU cache, don't affect state, only clear the lru cache
   */


  function clearCache() {
    lru.clear();
  }

  /**
   * Return the resrouce function
   *
   * @param {String} name - resource name
   * @param {*} force - skip check if exist cache when resource run
   */
  function getResource(name) {
    var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    // Return HOF that will delivery new promise where will try
    // resolve or run the previous configurated resource
    return function () {
      var args = arguments;
      var key = getKey(name, args);
      var recoveredResourceIdentity = lru.get(key);
      if (force || recoveredResourceIdentity === undefined) {
        var resource = props[name] || externalResources[name];

        if (typeof resource !== 'function') {
          throw Error('Context:Cache:Provider ' + name + ' resource is not a function ');
        }

        // const resultResource = resource.apply(null, args)

        // if (typeof resultResource.then !== 'function') {
        // }
        // resultResource
        //   .then(function(value) {
        //     const promiseResource = {
        //       status: 'resolved',
        //       args: value
        //     }

        //     lru.set(key, promiseResource)
        //     return value
        //   })
        //   .catch(e => {
        //     const promiseResource = {
        //       status: 'resolved',
        //       args: e
        //     }

        //     lru.set(key, promiseResource)
        //   })

        // const promiseResource = {
        //   status: 'pending',
        //   args: undefined
        // }

        // lru.set(key, promiseResource)
        // throw resultResource

        var deffered = new Promise(function (resolve, reject) {
          var resultResource = resource.apply(null, args);

          if (typeof resultResource.then === 'function') {
            return resultResource.then(function () {
              resolve.apply(null, arguments);
            }).catch(function (e) {
              reject(e);
            });
          }

          resolve(resultResource);
        });

        var promiseResource = {
          status: 'pending',
          args: undefined
        };
        lru.set(key, promiseResource);

        deffered.then(function (result) {
          var newPromiseResource = {
            status: 'resolved',
            args: result
          };
          lru.set(key, newPromiseResource);
        }).catch(function (e) {
          var newPromiseResource = {
            status: 'rejected',
            args: e.toString()
          };
          lru.set(key, newPromiseResource);
        });

        throw deffered;
      }

      return recoveredResourceIdentity.args;
    };
  }

  function hit(name) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    var key = getKey(name, Object.assign({}, args));
    return lru.has(key);
  }

  return React.createElement(
    context.Provider,
    { value: { getResource: getResource, clearCache: clearCache, hit: hit } },
    children
  );
}

Provider.propTypes = {
  children: PropTypes.any.isRequired,
  context: PropTypes.object.isRequired,
  initialItems: PropTypes.any,
  limit: PropTypes.number,
  externalResources: PropTypes.object
};

export default Provider;
//# sourceMappingURL=index.es.js.map
