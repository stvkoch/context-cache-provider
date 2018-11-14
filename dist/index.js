'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);
var XXH = _interopDefault(require('xxhashjs'));

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

var NEWER = Symbol("N");
var OLDER = Symbol("O");

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
    key: "_bump",
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
    key: "get",
    value: function get$$1(key) {
      // First, find our cache entry
      var entry = this.map.get(key);
      if (!entry) return; // Not cached. Sorry.
      // As <key> was found in the cache, register it as being requested recently
      this._bump(entry);
      return entry.value;
    }
  }, {
    key: "set",
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
    key: "shift",
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
    key: "has",
    value: function has(key) {
      return this.map.has(key);
    }
  }, {
    key: "assign",
    value: function assign(entries) {
      var entry = void 0,
          limit = this.limit || Number.MAX_VALUE;
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
          throw new Error("overflow");
        }
      }
      this.newest = entry;
      this.size = this.map.size;
    }
  }, {
    key: "clear",
    value: function clear() {
      // Not clearing links should be safe, as we don't expose live links to user
      this.oldest = this.newest = undefined;
      this.size = 0;
      this.map.clear();
    }
  }]);
  return LRUMap;
}();

var hashSeed = "notsecurity";
var lru = new LRUMap(100);

function getKey(name, args) {
  return XXH.h32(JSON.stringify(arguments), hashSeed).toString(16);
}

function Provider(_ref) {
  var children = _ref.children,
      context = _ref.context,
      _ref$initialItems = _ref.initialItems,
      initialItems = _ref$initialItems === undefined ? null : _ref$initialItems,
      _ref$externalResource = _ref.externalResources,
      externalResources = _ref$externalResource === undefined ? {} : _ref$externalResource,
      props = objectWithoutProperties(_ref, ["children", "context", "initialItems", "externalResources"]);

  var setTick = React.useState(void 0)[1];

  React.useEffect(function () {
    return initialItems && lru.assign(initialItems);
  });
  function clearCache() {
    lru.clear();
  }
  function getResource(name) {
    var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    return function () {
      var args = arguments;
      var key = getKey(name, args);

      if (force || !lru.has(key)) {
        var resource = props[name] || externalResources[name];
        var promise = new Promise(function (resolve, reject) {
          resource.apply(null, args).then(function () {
            resolve.apply(null, arguments);
          });
        });

        var promiseResource = {
          status: "pending",
          // promise,
          args: undefined
        };

        promise.then(function () {
          var newData = { status: "resolved", args: arguments };
          lru.set(key, newData);
          setTick(void 0);
        });

        lru.set(key, promiseResource);
        setTick(void 0);
        // throw promiseResource.promise;
        throw promise;
      }

      var recoveryResource = lru.get(key);
      if (recoveryResource.status === "resolved") {
        return recoveryResource.args[0];
      }
    };
  }

  return React__default.createElement(
    context.Provider,
    { value: { getResource: getResource, clearCache: clearCache } },
    children
  );
}

module.exports = Provider;
//# sourceMappingURL=index.js.map
