(function() {
  'use strict';

  angular.module('angular-jsonapi-rest', ['angular-jsonapi']);

})();

(function() {
  'use strict';

  angular.module('angular-jsonapi-rest')
  .factory('AngularJsonAPISourceRest', AngularJsonAPISourceRestWrapper);

  function AngularJsonAPISourceRestWrapper(
    AngularJsonAPIModelSourceError,
    AngularJsonAPISourcePrototype,
    AngularJsonAPIModelLinkerService,
    toKebabCase,
    $q,
    $http
  ) {

    AngularJsonAPISourceRest.prototype = Object.create(AngularJsonAPISourcePrototype.prototype);
    AngularJsonAPISourceRest.prototype.constructor = AngularJsonAPISourceRest;

    return {
      create: AngularJsonAPISourceRestFactory,
      encodeParams: encodeParams,
      decodeParams: decodeParams
    };

    function AngularJsonAPISourceRestFactory(name, url) {
      return new AngularJsonAPISourceRest(name, url);
    }

    function AngularJsonAPISourceRest(name, url) {
      var _this = this;
      var headers = { // jscs:disable disallowQuotedKeysInObjects
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      }; // jscs:enable disallowQuotedKeysInObjects

      AngularJsonAPISourcePrototype.apply(_this, arguments);

      _this.synchronization('remove', remove);
      _this.synchronization('unlink', unlink);
      _this.synchronization('link', link);
      _this.synchronization('update', update);
      _this.synchronization('add', add);
      _this.synchronization('all', all);
      _this.synchronization('get', get);
      _this.synchronization('refresh', get);

      function all(config) {
        return $http({
          method: 'GET',
          headers: headers,
          url: url,
          params: encodeParams(config.params)
        }).then(resolveHttp, rejectHttp.bind(null, 'all'));
      }

      function get(config) {
        return $http({
          method: 'GET',
          headers: headers,
          url: url + '/' + config.object.data.id,
          params: encodeParams(config.params)
        }).then(resolveHttp, rejectHttp.bind(null, 'get'));
      }

      function remove(config) {
        return $http({
          method: 'DELETE',
          headers: headers,
          url: url + '/' + config.object.data.id
        }).then(resolveHttp, rejectHttp.bind(null, 'remove'));
      }

      function unlink(config) {
        var deferred = $q.defer();
        var schema = config.object.schema.relationships[config.key];

        if (config.object.removed === true) {
          deferred.reject(AngularJsonAPIModelSourceError.create('Object has been removed', _this, 0, 'unlink'));
        } else if (config.target !== undefined && config.target.data.id === undefined) {
          deferred.reject(AngularJsonAPIModelSourceError.create('Can\'t unlink object without id through rest call', _this, 0, 'unlink'));
        } else if (schema.type === 'hasOne') {
          $http({
            method: 'DELETE',
            headers: headers,
            url: url + '/' + config.object.data.id + '/relationships/' + config.key
          }).then(resolveHttp, rejectHttp.bind(null, 'get')).then(deferred.resolve, deferred.reject);
        } else if (schema.type === 'hasMany') {
          if (config.target === undefined) {
            $http({
              method: 'PUT',
              headers: headers,
              data: {data: []},
              url: url + '/' + config.object.data.id + '/relationships/' + config.key
            }).then(resolveHttp, rejectHttp.bind(null, 'unlink')).then(deferred.resolve, deferred.reject);
          } else {
            $http({
              method: 'DELETE',
              headers: headers,
              url: url + '/' + config.object.data.id + '/relationships/' + config.key + '/' + config.target.data.id
            }).then(resolveHttp, rejectHttp.bind(null, 'unlink')).then(deferred.resolve, deferred.reject);
          }
        }

        return deferred.promise;
      }

      function link(config) {
        var deferred = $q.defer();
        var schema = config.object.schema.relationships[config.key];

        if (config.object.removed === true) {
          deferred.reject({errors: [{status: 0, statusText: 'Object has been removed'}]});
        } else if (config.target === undefined || config.target.data.id === undefined) {
          deferred.reject({errors: [{status: 0, statusText: 'Can\'t link object without id through rest call'}]});
        } else if (schema.type === 'hasOne') {
          $http({
            method: 'PUT',
            headers: headers,
            data: {data: AngularJsonAPIModelLinkerService.toLinkData(config.target)},
            url: url + '/' + config.object.data.id + '/relationships/' + config.key
          }).then(resolveHttp, rejectHttp.bind(null, 'link')).then(deferred.resolve, deferred.reject);
        } else if (schema.type === 'hasMany') {
          $http({
            method: 'POST',
            headers: headers,
            data: {data: [AngularJsonAPIModelLinkerService.toLinkData(config.target)]},
            url: url + '/' + config.object.data.id + '/relationships/' + config.key
          }).then(resolveHttp, rejectHttp.bind(null, 'link')).then(deferred.resolve, deferred.reject);
        }

        return deferred.promise;
      }

      function update(config) {
        return $http({
          method: 'PUT',
          headers: headers,
          url: url + '/' + config.object.data.id,
          data: config.object.form.toJson()
        }).then(resolveHttp, rejectHttp.bind(null, 'update'));
      }

      function add(config) {
        return $http({
          method: 'POST',
          headers: headers,
          url: url,
          data: config.object.form.toJson()
        }).then(resolveHttp, rejectHttp.bind(null, 'add'));
      }

      function resolveHttp(response) {
        return $q.resolve(response.data);
      }

      function rejectHttp(action, response) {
        var deferred = $q.defer();

        if (response.status === 0) {
          $http({
            method: 'GET',
            url: 'https://status.cloud.google.com/incidents.schema.json'
          }).then(rejectServerOffline, rejectNoConnection);
        } else {
          deferred.reject(AngularJsonAPIModelSourceError.create(response.statusText, _this, response.status, action));
        }

        return deferred.promise;

        function rejectServerOffline(response) {
          deferred.reject(AngularJsonAPIModelSourceError.create('Server is offline', _this, response.status, action));
        }

        function rejectNoConnection() {
          deferred.reject(AngularJsonAPIModelSourceError.create('No internet connection', _this, response.status, action));
        }
      }
    }

    function encodeParams(params) {
      var encodedParams = {};

      if (params === undefined) {
        return {};
      }

      angular.forEach(params, function(paramValue, paramKey) {
        if (angular.isArray(paramValue)) {
          encodedParams[paramKey] = encodeValue(paramValue);
        } else if (angular.isObject(paramValue)) {
          angular.forEach(paramValue, function(paramInnerValue, paramInnerKey) {
            encodedParams[paramKey + '[' + paramInnerKey + ']'] = encodeValue(paramInnerValue);
          });
        } else {
          encodedParams[paramKey] = paramValue;
        }
      });

      return encodedParams;

      function encodeValue(argument) {
        if (angular.isArray(argument)) {
          return argument.join(',');
        } else {
          return argument;
        }
      }
    }

    function decodeParams(params) {
      var decodedParams = {};

      angular.forEach(params, function(value, key) {
        var objectKeyStart = key.indexOf('[');
        value = value.split(',');

        if (objectKeyStart > -1) {
          var objectKey = key.substr(0, objectKeyStart);
          var objectElementKey = key.substr(objectKeyStart + 1, key.indexOf(']') - objectKeyStart - 1);

          decodedParams[objectKey] = decodedParams[objectKey] || {};
          decodedParams[objectKey][objectElementKey] = value;
        } else {
          decodedParams[key] = value;
        }
      });

      return decodedParams;
    }
  }
  AngularJsonAPISourceRestWrapper.$inject = ["AngularJsonAPIModelSourceError", "AngularJsonAPISourcePrototype", "AngularJsonAPIModelLinkerService", "toKebabCase", "$q", "$http"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi-rest')
  .config(provide);

  function provide($provide) {
    $provide.decorator('$jsonapi', decorator);
  }
  provide.$inject = ["$provide"];

  function decorator($delegate, AngularJsonAPISourceRest) {
    var $jsonapi = $delegate;

    $jsonapi.sourceRest = AngularJsonAPISourceRest;

    return $jsonapi;
  }
  decorator.$inject = ["$delegate", "AngularJsonAPISourceRest"];
})();

(function() {
  'use strict';

  /* global Parse: false */
  angular.module('angular-jsonapi-parse', ['angular-jsonapi'])
    .constant('Parse', Parse);
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi-parse')
  .factory('AngularJsonAPISourceParse', AngularJsonAPISourceParseWrapper);

  function AngularJsonAPISourceParseWrapper(
    AngularJsonAPIModelSourceError,
    AngularJsonAPISourcePrototype,
    AngularJsonAPIModelLinkerService,
    pluralize,
    Parse,
    $log,
    $q
  ) {

    AngularJsonAPISourceParse.prototype = Object.create(AngularJsonAPISourcePrototype.prototype);
    AngularJsonAPISourceParse.prototype.constructor = AngularJsonAPISourceParse;
    AngularJsonAPISourceParse.prototype.initialize = initialize;

    return {
      create: AngularJsonAPISourceParseFactory
    };

    function AngularJsonAPISourceParseFactory(name, table) {
      return new AngularJsonAPISourceParse(name, table);
    }

    function AngularJsonAPISourceParse(name, table) {
      var _this = this;

      _this.ParseObject = Parse.Object.extend(table);
      _this.type = pluralize(table).charAt(0).toLowerCase() + pluralize(table).slice(1);

      AngularJsonAPISourcePrototype.apply(_this, arguments);

      _this.synchronization('remove', remove);
      _this.synchronization('update', update);
      _this.synchronization('add', update);
      _this.synchronization('all', all);
      _this.synchronization('get', get);
      _this.synchronization('refresh', get);

      function all(config) {
        var query = new Parse.Query(_this.ParseObject);

        if (config.params.limit !== undefined) {
          query.limit(config.params.limit);
        }

        angular.forEach(config.params.filter, function(filter) {
          query.equalTo(filter.key, filter.value);
        });

        return query.find().then(resolveParse, rejectParse.bind(null, 'all'));
      }

      function get(config) {
        var query = new Parse.Query(_this.ParseObject);
        return query.get(config.object.data.id).then(resolveParse, rejectParse.bind(null, 'get'));
      }

      function remove(config) {
        var object = new _this.ParseObject();
        object.set('id', config.object.data.id);
        return object.destroy().then(resolveParse, rejectParse.bind(null, 'remove'));
      }

      function update(config) {
        var object = toParseObject(config.object);
        return object.save(null).then(resolveParse, rejectParse.bind(null, 'update'));
      }

      function toParseObject(object) {
        var parseObject = new _this.ParseObject();
        angular.forEach(object.form.data.attributes, function(attribute, key) {
          parseObject.set(key, attribute);
        });

        angular.forEach(object.schema.relationships, function(relationship, key) {
          if (relationship.type === 'hasOne'
            && object.form.data.relationships[key].data !== null
            && object.form.data.relationships[key].data !== undefined
          ) {
            var table = pluralize(key, 1).charAt(0).toUpperCase() + pluralize(key, 1).slice(1);
            var parsePointer = new (Parse.Object.extend(table))();
            parsePointer.set('id', object.form.data.relationships[key].data.id);
            parseObject.set(key, parsePointer);
          }
        });

        return parseObject;
      }

      function fromParseObject(object) {
        var relationships = _this.synchronizer.resource.schema.relationships;
        object.type = _this.type;
        object.relationships = object.relationships || [];
        angular.forEach(relationships, function(relationship, key) {
          if (object.attributes[key] && relationship.type === 'hasOne') {
            object.relationships[key] = {
              data: {
                type: relationship.model,
                id: object.attributes[key].id
              }
            };
          }
        });

        return object;
      }

      function resolveParse(response) {
        if (angular.isArray(response)) {
          angular.forEach(response, function(elem, key) {
            response[key] = fromParseObject(elem);
          });
        } else if (angular.isObject(response)) {
          response = fromParseObject(response);
        }

        return $q.resolve({
          data: response
        });
      }

      function rejectParse(action, response) {
        $log.error('Parse error for', action, response);
        return $q.reject(response);
      }
    }

    function initialize(appId, jsKey) {
      Parse.initialize(appId, jsKey);
    }
  }
  AngularJsonAPISourceParseWrapper.$inject = ["AngularJsonAPIModelSourceError", "AngularJsonAPISourcePrototype", "AngularJsonAPIModelLinkerService", "pluralize", "Parse", "$log", "$q"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi-parse')
  .config(provide);

  function provide($provide) {
    $provide.decorator('$jsonapi', decorator);
  }
  provide.$inject = ["$provide"];

  function decorator($delegate, AngularJsonAPISourceParse) {
    var $jsonapi = $delegate;

    $jsonapi.sourceLocal = AngularJsonAPISourceParse;

    return $jsonapi;
  }
  decorator.$inject = ["$delegate", "AngularJsonAPISourceParse"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi-local', ['angular-jsonapi']);

})();

(function() {
  'use strict';

  angular.module('angular-jsonapi-local')
  .factory('AngularJsonAPISourceLocal', AngularJsonAPISourceLocalWrapper);

  function AngularJsonAPISourceLocalWrapper(
    AngularJsonAPISourcePrototype,
    $window,
    $q
  ) {
    var size = {
      max: 0,
      all: 0,
      limit: 5200000,
      list: {}
    };

    AngularJsonAPISourceLocal.prototype = Object.create(AngularJsonAPISourcePrototype.prototype);
    AngularJsonAPISourceLocal.prototype.constructor = AngularJsonAPISourceLocal;

    return {
      create: AngularJsonAPISourceLocalFactory,
      size: size
    };

    function AngularJsonAPISourceLocalFactory(name, prefix) {
      return new AngularJsonAPISourceLocal(name, prefix);
    }

    function AngularJsonAPISourceLocal(name, prefix) {
      var _this = this;

      prefix = prefix || 'AngularJsonAPI';

      _this.__updateStorage = updateStorage;

      AngularJsonAPISourcePrototype.apply(_this, arguments);

      _this.synchronization('init', init);

      _this.begin('clearCache', clear);

      _this.finish('init', updateStorage);
      _this.finish('clearCache', updateStorage);
      _this.finish('remove', updateStorage);
      _this.finish('refresh', updateStorage);
      _this.finish('unlink', updateStorage);
      _this.finish('unlinkReflection', updateStorage);
      _this.finish('link', updateStorage);
      _this.finish('linkReflection', updateStorage);
      _this.finish('update', updateStorage);
      _this.finish('add', updateStorage);
      _this.finish('get', updateStorage);
      _this.finish('all', updateStorage);
      _this.finish('include', updateStorage);

      function init() {
        var type = _this.synchronizer.resource.schema.type;
        return $q.resolve($window.localStorage.getItem(prefix + '.' + type));
      }

      function clear() {
        var type = _this.synchronizer.resource.schema.type;
        var key = prefix + '.' + type;

        size.all -= size.list[key];
        delete size.list[key];
        size.max = objectMaxKey(size.list);
        size.fraction = size.list[size.max] / size.limit * 100;

        $window.localStorage.removeItem(key);
      }

      function updateStorage() {
        var type = _this.synchronizer.resource.schema.type;
        var cache = _this.synchronizer.resource.cache;
        var json = cache.toJson();
        var key = prefix + '.' + type;

        size.list[key] = size.list[key] === undefined ? 0 : size.list[key];
        size.all += json.length - size.list[key];
        size.list[key] = json.length;
        size.max = objectMaxKey(size.list);
        size.fraction = size.list[size.max] / size.limit * 100;

        $window.localStorage.setItem(key, json);
      }

      function objectMaxKey(object) {
        return Object.keys(object).reduce(function(m, k) {
          return object[k] > object[m] ? k : m;
        }, Object.keys(object)[0]);
      }
    }
  }
  AngularJsonAPISourceLocalWrapper.$inject = ["AngularJsonAPISourcePrototype", "$window", "$q"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi-local')
  .config(provide);

  function provide($provide) {
    $provide.decorator('$jsonapi', decorator);
  }
  provide.$inject = ["$provide"];

  function decorator($delegate, AngularJsonAPISourceLocal) {
    var $jsonapi = $delegate;

    $jsonapi.sourceLocal = AngularJsonAPISourceLocal;

    return $jsonapi;
  }
  decorator.$inject = ["$delegate", "AngularJsonAPISourceLocal"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi', ['uuid4'])
  /* global pluralize: false, validate: false */
  .constant('pluralize', pluralize)
  .constant('validateJS', validate);
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIResourceCache', AngularJsonAPIResourceCacheWrapper);

  function AngularJsonAPIResourceCacheWrapper(
    uuid4,
    $log
  ) {

    AngularJsonAPIResourceCache.prototype.get = get;
    AngularJsonAPIResourceCache.prototype.index = index;
    AngularJsonAPIResourceCache.prototype.setIndexIds = setIndexIds;
    AngularJsonAPIResourceCache.prototype.addOrUpdate = addOrUpdate;

    AngularJsonAPIResourceCache.prototype.fromJson = fromJson;
    AngularJsonAPIResourceCache.prototype.toJson = toJson;
    AngularJsonAPIResourceCache.prototype.clear = clear;

    AngularJsonAPIResourceCache.prototype.remove = remove;
    AngularJsonAPIResourceCache.prototype.revertRemove = revertRemove;
    AngularJsonAPIResourceCache.prototype.clearRemoved = clearRemoved;

    return {
      create: AngularJsonAPIResourceCacheFactory
    };

    function AngularJsonAPIResourceCacheFactory(resource) {
      return new AngularJsonAPIResourceCache(resource);
    }

    /**
     * Constructor
     */
    function AngularJsonAPIResourceCache(resource) {
      var _this = this;

      _this.resource = resource;
      _this.data = {};
      _this.removed = {};
      _this.size = 0;

      _this.indexIds = undefined;
    }

    /**
     * Add new model or update existing with data
     * @param {object} validatedData Data that are used to update or create an object, has to be valid
     * @return {AngularJsonAPIModel} Created model
     */
    function addOrUpdate(validatedData, config, updatedAt) {
      var _this = this;
      var id = validatedData.id;

      if (id === undefined) {
        $log.error('Can\'t add data without id!', validatedData);
        return;
      }

      if (_this.data[id] === undefined) {
        _this.data[id] = _this.resource.modelFactory(validatedData, config, updatedAt);
        _this.size += 1;
      } else {
        _this.data[id].update(validatedData, !config.new, config.initialization);
      }

      return _this.data[id];
    }


    /**
     * Recreate object structure from json data
     * @param  {json} json Json data
     * @return {undefined}
     */
    function fromJson(json) {
      var _this = this;
      var collection = angular.fromJson(json);

      var config = {
        new: false,
        synchronized: false,
        stable: false,
        pristine: false,
        initialization: true
      };

      if (angular.isObject(collection) && collection.data !== undefined) {
        _this.updatedAt = collection.updatedAt;
        _this.indexIds = collection.indexIds;

        angular.forEach(collection.data, function(objectData) {
          var data = objectData.data;
          _this.addOrUpdate(data, config, objectData.updatedAt);
        });
      }
    }

    /**
     * Encodes memory into json format
     * @return {json} Json encoded memory
     */
    function toJson() {
      var _this = this;
      var json = {
        data: [],
        updatedAt: _this.updatedAt,
        indexIds: _this.indexIds
      };

      angular.forEach(_this.data, function(object) {
        if (object.hasErrors() === false) {
          json.data.push(object.toJson());
        }
      });

      return angular.toJson(json);
    }

    /**
     * Clear memory
     * @return {undefined}
     */
    function clear() {
      var _this = this;

      _this.indexIds = undefined;
      _this.data = {};
      _this.removed = {};
    }

    /**
     * Low level get used internally, does not run any synchronization
     * @param  {uuid} id
     * @return {AngularJsonAPIModel} Model associated with id
     */
    function get(id) {
      var _this = this;

      var data = {
        id: id,
        type: _this.resource.schema.type
      };

      var config = {
        new: false,
        synchronized: false,
        stable: false,
        pristine: true
      };

      if (_this.data[id] === undefined) {
        _this.data[id] = _this.resource.modelFactory(data, config);
      }

      return _this.data[id];
    }

    /**
     * Low level get used internally, does not run any synchronization, used for index requests
     * @param  {objec} params
     * @return {AngularJsonAPIModel} Model associated with id
     */
    function index(params) {
      var _this = this;
      params = params || {};

      if (_this.indexIds === undefined) {
        return _this.indexIds;
      }

      return _this.indexIds.map(_this.get.bind(_this)).filter(filter);

      function filter(argument) {
        var filterParams  = params.filter;
        var valid = true;

        angular.forEach(filterParams, function(constraint) {
          valid = valid && argument.data.attributes[constraint.key] === constraint.value;
        });

        return valid;
      }
    }

    /**
     * Cache ids of objects returned by index request
     * @param {ids array or AngularJsonAPIModel array} array Objects or ids to be cached
     */
    function setIndexIds(array) {
      var _this = this;

      _this.indexIds = [];

      angular.forEach(array, function(element) {
        if (angular.isString(element) && _this.resource.schema.id.validate(element)) {
          _this.indexIds.push(element);
        } else if (angular.isObject(element) && _this.resource.schema.id.validate(element.data.id)) {
          _this.indexIds.push(element.data.id);
        }
      });
    }

    /**
     * Remove object with given id from cache
     * @param  {uuid} id
     * @return {AngularJsonAPIModel / undefined}    Removed object, undefined if
     * object does not exist
     */
    function remove(id) {
      var _this = this;

      if (_this.data[id] !== undefined) {
        _this.removed[id] = _this.data[id];
        delete _this.data[id];
        _this.size -= 1;
      }

      return _this.removed[id];
    }

    /**
     * Revert removal of an object with given id from cache
     * @param  {uuid} id
     * @return {AngularJsonAPIModel / undefined}    Removed object, undefined if
     * object does not exist
     */
    function revertRemove(id) {
      var _this = this;

      if (_this.removed[id] !== undefined) {
        _this.data[id] = _this.removed[id];
        delete _this.removed[id];
        _this.size += 1;
      }

      return _this.data[id];
    }

    /**
     * Clear removed object from memory
     * @param  {uuid} id
     * @return {undefined}
     */
    function clearRemoved(id) {
      var _this = this;

      delete _this.removed[id];
    }
  }
  AngularJsonAPIResourceCacheWrapper.$inject = ["uuid4", "$log"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .service('AngularJsonAPIModelLinkerService', AngularJsonAPIModelLinkerService);

  function AngularJsonAPIModelLinkerService($log) {
    var _this = this;

    _this.toLinkData = toLinkData;

    _this.link = link;
    _this.unlink = unlink;

    return this;

    /**
     * Extracts data needed for relationship linking from object
     * @param  {AngularJsonAPIModel} object Object
     * @return {json}        Link data
     */
    function toLinkData(object) {
      if (object === null) {
        return null;
      }

      return {type: object.data.type, id: object.data.id};
    }

    /**
     * Add target to object relationships and data.relationships
     * @param {AngularJsonAPIModel} object     Object to be modified
     * @param {string} key        Relationship name
     * @param {AngularJsonAPIModel} target     Object to be linked
     * @param {AngularJsonAPISchema} schema     Relationship schema
     */
    function link(object, key, target, oneWay, form) {
      var schema;
      form = form === undefined ? false : form;

      if (object === undefined) {
        $log.error('Can\'t add link to non existing object', object, key, target);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        return [];
      }

      schema = object.schema.relationships[key];

      if (target === undefined) {
        $log.error('Can\'t link non existing object', object, key, target, schema);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        $log.error('Schema:', schema);
        return [];
      }

      if (schema === undefined) {
        $log.error('Can\'t add link not present in schema:', object, key, target, schema);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        $log.error('Schema:', schema);
        return [];
      }

      if (target !== null && schema.polymorphic === false && schema.model !== target.data.type) {
        $log.error('This relation is not polymorphic, expected: ' + schema.model + ' instead of ' + target.data.type);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        $log.error('Schema:', schema);
        return [];
      }

      if (schema.type === 'hasMany') {
        if (oneWay === true) {
          __addHasMany(object, key, target, form);
          return [];
        } else {
          return __processAddHasMany(object, key, target, form);
        }
      } else if (schema.type === 'hasOne') {
        if (oneWay === true) {
          __addHasOne(object, key, target, form);
          return [];
        } else {
          return __processAddHasOne(object, key, target, form);
        }
      }
    }

    /**
     * Remove target from object relationships and data.relationships
     * @param {AngularJsonAPIModel} object     Object to be modified
     * @param {string} key        Relationship name
     * @param {AngularJsonAPIModel} target     Object to be unlinked
     * @param {AngularJsonAPISchema} schema     Relationship schema
     */
    function unlink(object, key, target, oneWay, form) {
      var schema;
      form = form === undefined ? false : form;

      if (object === undefined) {
        $log.error('Can\'t remove link from non existing object', object, key, target);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        return [];
      }

      schema = object.schema.relationships[key];

      if (schema === undefined) {
        $log.error('Can\'t remove link not present in schema:', object, key, target, schema);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        $log.error('Schema:', schema);
        return [];
      }

      if (oneWay === true) {
        __removeHasMany(object, key, target, form);
        return [];
      } else {
        return __processRemove(object, key, target, form);
      }
    }

    /////////////
    // Private //
    /////////////

    function __processAddHasMany(object, key, target, form) {
      var reflectionKey = object.schema.relationships[key].reflection;
      var reflectionSchema;

      if (reflectionKey === false) {
        __addHasMany(object, key, target, form);
        return [];
      }

      reflectionSchema = target.schema.relationships[reflectionKey];

      if (reflectionSchema === undefined) {
        $log.error('Cannot find reflection of', key, 'relationship for', object.data.type, 'in', target.data.type);
        $log.error('For one side relationships set schema.reflection to false');
        return [];
      } else if (reflectionSchema.type === 'hasOne') {
        return __swapResults(
          __wrapResults(object, key, target),
          __wrapResults(target, reflectionKey, object),
          __processAddHasOne(target, reflectionKey, object, form)
        );
      } else if (reflectionSchema.type === 'hasMany') {
        __addHasMany(object, key, target, form);
        __addHasMany(target, reflectionKey, object, form);
        return [__wrapResults(target, reflectionKey, object)];
      }
    }

    function __processAddHasOne(object, key, target, form) {
      var reflectionKey = object.schema.relationships[key].reflection;
      var oldReflection = object.relationships[key];
      var reflectionSchema;
      var oldReflectionSchema;
      var result = [];

      __addHasOne(object, key, target, form);

      if (reflectionKey === false) {
        return [];
      }

      if (oldReflection !== undefined && oldReflection !== null) {
        oldReflectionSchema = oldReflection.schema.relationships[reflectionKey];

        if (oldReflectionSchema !== undefined) {
          if (oldReflectionSchema.type === 'hasOne') {
            __removeHasOne(oldReflection, reflectionKey, object, form);
          } else if (oldReflectionSchema.type === 'hasMany') {
            __removeHasMany(oldReflection, reflectionKey, object, form);
          }

          result.push(__wrapResults(oldReflection, reflectionKey, object));
        } else {
          $log.error('Cannot find reflection of', key, 'relationship for', object.data.type, 'in', target.data.type);
          $log.error('For one side relationships set schema.reflection to false');
        }
      }

      if (target !== undefined && target !== null && reflectionKey !== false) {
        reflectionSchema = target.schema.relationships[reflectionKey];
        if (reflectionSchema !== undefined) {
          if (reflectionSchema.type === 'hasOne') {
            __addHasOne(target, reflectionKey, object, form);
          } else if (reflectionSchema.type === 'hasMany') {
            __addHasMany(target, reflectionKey, object, form);
          }

          result.push(__wrapResults(target, reflectionKey, object));
        } else {
          $log.error('Cannot find reflection of', key, 'relationship for', object.data.type, 'in', target.data.type);
          $log.error('For one side relationships set schema.reflection to false');
        }
      }

      return result;
    }

    function __processRemove(object, key, target, form) {
      var schema = object.schema.relationships[key];
      var reflectionKey = schema.reflection;
      var reflectionSchema;

      if (schema.type === 'hasMany') {
        __removeHasMany(object, key, target, form);
      } else if (schema.type === 'hasOne') {
        __removeHasOne(object, key, target, form);
      }

      if (reflectionKey === false) {
        return [];
      }

      reflectionSchema = target.schema.relationships[reflectionKey];

      if (reflectionSchema !== undefined) {
        if (reflectionSchema.type === 'hasOne') {
          __removeHasOne(target, reflectionKey, object, form);
        } else if (reflectionSchema.type === 'hasMany') {
          __removeHasMany(target, reflectionKey, object, form);
        }
      } else {
        $log.error('Cannot find reflection of', key, 'relationship for', object.data.type, 'in', target.data.type);
        $log.error('For one side relationships set schema.reflection to false');
        return [];
      }

      return [__wrapResults(target, reflectionKey, object)];
    }

    function __addHasOne(object, key, target, form) {
      $log.debug('addHasOne', object, key, target);

      if (form === true) {
        object = object.form;
      }

      object.relationships[key] = target;
      object.data.relationships[key].data = toLinkData(target);

      if (form === false) {
        object.reset(true);
      }

      return true;
    }

    function __addHasMany(object, key, target, form) {
      $log.debug('addHasMany', object, key, target);

      var linkData = toLinkData(target);
      if (form === true) {
        object = object.form;
      }

      if (angular.isArray(object.relationships[key]) && object.relationships[key].indexOf(target) > -1) {
        return false;
      }

      object.relationships[key] = object.relationships[key] || [];
      object.data.relationships[key].data = object.data.relationships[key].data || [];

      object.relationships[key].push(target);
      object.data.relationships[key].data.push(linkData);

      if (form === false) {
        object.reset(true);
      }

      return true;
    }

    function __removeHasOne(object, key, target, form) {
      $log.debug('removeHasOne', object, key, target);

      if (form === true) {
        object = object.form;
      }

      if (target !== undefined && object.relationships[key] !== target) {
        return false;
      }

      object.relationships[key] = null;
      object.data.relationships[key].data = undefined;

      if (form === false) {
        object.reset(true);
      }

      return true;
    }

    function __removeHasMany(object, key, target, form) {
      $log.debug('removeHasMany', object, key, target);

      if (form === true) {
        object = object.form;
      }

      if (object.relationships[key] === undefined) {
        return;
      }

      if (target === undefined) {
        object.relationships[key] = [];
        object.data.relationships[key].data = [];
        if (form === false) {
          object.reset(true);
        }

        return true;
      }

      var index = object.relationships[key].indexOf(target);

      if (index === -1) {
        return false;
      }

      object.relationships[key].splice(index, 1);
      object.data.relationships[key].data.splice(index, 1);

      if (form === false) {
        object.reset(true);
      }

      return true;
    }

    function __wrapResults(object, key, target) {
      return {
        object: object,
        key: key,
        target: target
      };
    }

    function __swapResults(value, newValue, array) {
      var index = -1;
      angular.forEach(array, function(item, i) {
        if (item.object === value.object && item.key === value.key && item.target === value.target) {
          index = i;
        }
      });

      if (index > -1) {
        array[index] = newValue;
      } else {
        array.push(newValue);
      }

      return array;
    }
  }
  AngularJsonAPIModelLinkerService.$inject = ["$log"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModelForm', AngularJsonAPIModelFormWrapper);

  function AngularJsonAPIModelFormWrapper(
    AngularJsonAPIModelValidationError,
    AngularJsonAPIModelLinkerService,
    validateJS,
    $q
  ) {

    AngularJsonAPIModelForm.prototype.save = save;
    AngularJsonAPIModelForm.prototype.reset = reset;
    AngularJsonAPIModelForm.prototype.validate = validate;

    AngularJsonAPIModelForm.prototype.link = link;
    AngularJsonAPIModelForm.prototype.unlink = unlink;

    AngularJsonAPIModelForm.prototype.toJson = toJson;

    return {
      create: AngularJsonAPIModelFormFactory
    };

    function AngularJsonAPIModelFormFactory(parent) {
      return new AngularJsonAPIModelForm(parent);
    }

    function AngularJsonAPIModelForm(parent) {
      var _this = this;

      _this.data = {
        id: parent.data.id,
        type: parent.data.type,
        attributes: {},
        relationships: {}
      };

      _this.relationships = {};
      _this.parent = parent;
      _this.schema = parent.schema;
      _this.reset();
    }

    /**
     * Encodes object into json
     * @return {json} Json object
     */
    function toJson() {
      var _this = this;
      var data = angular.copy(_this.data);
      var relationships = {};

      angular.forEach(data.relationships, function(value, key) {
        if (value.data !== undefined) {
          relationships[key] = value;
        }
      });

      data.relationships = relationships;

      return {
        data: data
      };
    }

    /**
     * Saves form, shortcut to parent.save()
     * @return {promise} Promise associated with synchronization
     */
    function save() {
      var _this = this;

      return _this.parent.save();
    }

    /**
     * Resets form to state of a parent
     * @return {undefined}
     */
    function reset(auto) {
      var _this = this;

      angular.forEach(_this.schema.relationships, function(data, key) {
        _this.data.relationships[key] = angular.copy(_this.parent.data.relationships[key]) || {};
        if (angular.isArray(_this.relationships[key])) {
          _this.relationships[key] = _this.parent.relationships[key].slice();
        } else {
          _this.relationships[key] = _this.parent.relationships[key];
        }
      });

      if (auto === true && _this.parent.synchronized === true) {
        return;
      }

      angular.forEach(_this.schema.attributes, function(validator, key) {
        _this.data.attributes[key] = angular.copy(_this.parent.data.attributes[key]);
      });

      _this.parent.errors.validation.clear();
    }

    /**
     * Validates form
     * @return {promise} Promise rejected to errors object indexed by keys. If the
     * key param i stated it only validates an attribute, else all attributes.
     */
    function validate(key) {
      var _this = this;
      var attributesWrapper;
      var constraintsWrapper;
      var deferred = $q.defer();

      if (key === undefined) {
        attributesWrapper = _this.data.attributes;
        constraintsWrapper = _this.schema.attributes;
      } else {
        attributesWrapper = {};
        constraintsWrapper = {};

        attributesWrapper[key] = _this.data.attributes[key];
        constraintsWrapper[key] = _this.schema.attributes[key];
      }

      validateJS.async(
        attributesWrapper,
        constraintsWrapper
      ).then(resolve, reject);

      function resolve() {
        if (key === undefined) {
          _this.parent.errors.validation.clear();
        } else {
          _this.parent.errors.validation.clear(key);
        }

        deferred.resolve();
      }

      function reject(errorsMap) {
        _this.parent.error = true;
        if (key === undefined) {
          _this.parent.errors.validation.clear();
        } else {
          _this.parent.errors.validation.clear(key);
        }

        angular.forEach(errorsMap, function(errors, attribute) {
          angular.forEach(errors, function(error) {
            _this.parent.errors.validation.add(attribute, AngularJsonAPIModelValidationError.create(error, attribute));
          });
        });

        deferred.reject(_this.parent.errors.validation);
      }

      return deferred.promise;
    }

    /**
     * Adds link to a form without synchronization
     * @param {string} key    Relationship name
     * @param {AngularJsonAPIModel} target Object to be linked
     * @return {Boolean}        Status
     */
    function link(key, target, oneWay) {
      var _this = this;
      oneWay = oneWay === undefined ? false : true;

      return $q.resolve(AngularJsonAPIModelLinkerService.link(_this.parent, key, target, oneWay, true));
    }

    /**
     * Removes link from form without synchronization
     * @param  {[type]} key    Relationship name
     * @param {AngularJsonAPIModel} target Object to be linked
     * @return {Boolean}        Status
     */
    function unlink(key, target, oneWay) {
      var _this = this;
      oneWay = oneWay === undefined ? false : true;

      return $q.resolve(AngularJsonAPIModelLinkerService.unlink(_this.parent, key, target, oneWay, true));
    }
  }
  AngularJsonAPIModelFormWrapper.$inject = ["AngularJsonAPIModelValidationError", "AngularJsonAPIModelLinkerService", "validateJS", "$q"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIAbstractModel', AngularJsonAPIAbstractModelWrapper);

  function AngularJsonAPIAbstractModelWrapper(
    AngularJsonAPIModelSourceError,
    AngularJsonAPIModelValidationError,
    AngularJsonAPIModelErrorsManager,
    AngularJsonAPIModelLinkerService,
    AngularJsonAPIModelForm,
    $rootScope,
    $injector,
    $log,
    $q
  ) {
    AngularJsonAPIAbstractModel.prototype.refresh = refresh;
    AngularJsonAPIAbstractModel.prototype.remove = remove;
    AngularJsonAPIAbstractModel.prototype.reset = reset;
    AngularJsonAPIAbstractModel.prototype.save = save;

    AngularJsonAPIAbstractModel.prototype.update = update;

    AngularJsonAPIAbstractModel.prototype.link = link;
    AngularJsonAPIAbstractModel.prototype.unlink = unlink;
    AngularJsonAPIAbstractModel.prototype.unlinkAll = unlinkAll;

    AngularJsonAPIAbstractModel.prototype.toJson = toJson;

    AngularJsonAPIAbstractModel.prototype.hasErrors = hasErrors;

    return AngularJsonAPIAbstractModel;

    /**
     * Constructor
     * @param {json}  data      Validated data used to create an object
     * @param {object} config   Is object new (for form)
     */
    function AngularJsonAPIAbstractModel(data, config, updatedAt) {
      var _this = this;

      data.relationships = data.relationships || {};

      /**
       * Is not a new record
       * @type {Boolean}
       */
      _this.new = config.new === undefined ? false : config.new;

      /**
       * Is present on the server
       * @type {Boolean}
       */
      _this.stable = config.stable === undefined ? true : config.stable;

      /**
       * Has been synchronized with the server
       * @type {Boolean}
       */
      _this.synchronized = config.synchronized === undefined ? true : config.synchronized;

      /**
       * Has just been created by request and may not exist on the server
       * @type {Boolean}
       */
      _this.pristine = config.pristine === undefined ? true : config.pristine;

      _this.removed = false;
      _this.loading = false;
      _this.saving = false;
      _this.updatedAt = _this.synchronized === true ? Date.now() : updatedAt;

      _this.loadingCount = 0;
      _this.savingCount = 0;

      _this.data = {
        relationships: {},
        attributes: {}
      };
      _this.relationships = {};

      angular.forEach(_this.schema.relationships, function(schema, key) {
        _this.relationships[key] = undefined;
      });

      _this.errors = {
        validation: AngularJsonAPIModelErrorsManager.create(
          'Validation',
          'Errors of attributes validation',
          AngularJsonAPIModelValidationError
        ),
        synchronization: AngularJsonAPIModelErrorsManager.create(
          'Source',
          'Errors of synchronizations',
          AngularJsonAPIModelSourceError
        )
      };

      _this.promise = $q.resolve(_this);

      __setData(_this, data);

      _this.form = AngularJsonAPIModelForm.create(_this);
    }

    /**
     * Saves model's form
     * @return {promise} Promise associated with synchronization that resolves to this
     */
    function save() {
      var _this = this;
      var deferred = $q.defer();
      var config = {
        action: _this.new === true ? 'add' : 'update',
        object: _this
      };

      _this.form.validate().then(
        synchronize,
        deferred.reject
      ).finally(__decrementSavingCounter.bind(_this, undefined));

      __incrementSavingCounter(_this);

      return deferred.promise;

      function synchronize() {
        _this.synchronize(config).then(resolve, reject, notify);
      }

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:' + config.action, 'resolved', _this, response);
        _this.update(response.data.data);

        if (_this.new === true) {
          _this.resource.cache.indexIds = _this.resource.cache.indexIds || [];
          _this.resource.cache.indexIds.push(_this.data.id);
        }

        _this.synchronized = true;
        _this.new = false;
        _this.pristine = false;
        _this.stable = true;

        response.finish();
        _this.errors.synchronization.concat(response.errors);
        deferred.resolve(response.data.meta);
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:save', 'rejected', _this, response);

        response.finish();
        _this.errors.synchronization.concat(response.errors);
        deferred.reject(_this);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:save', 'notify', _this, response);

        deferred.notify(response);
      }
    }

    /**
     * Reset object form
     * @return {undefined}
     */
    function reset() {
      var _this = this;

      if (_this.form !== undefined) {
        _this.form.reset();
      }
    }

    /**
     * Synchronize object with remote
     * @return {promise} Promise associated with synchronization that resolves to this
     */
    function refresh(params) {
      var $jsonapi = $injector.get('$jsonapi');
      var deferred = $q.defer();
      var _this = this;
      params = params === undefined ? _this.schema.params.get : params;

      var config = {
        action: 'refresh',
        object: _this,
        params: params
      };

      if (_this.new === true) {
        var error = AngularJsonAPIModelSourceError.create('Can\'t refresh new object', null, 0, 'refresh');
        _this.errors.synchronization.add('refresh', error);
        deferred.reject(error);
      } else {
        __incrementLoadingCounter(_this);

        _this.synchronize(config)
          .then(resolve, reject, notify)
          .finally(__decrementLoadingCounter.bind(_this, undefined));
      }

      return deferred.promise;

      function resolve(response) {
        var results = $jsonapi.__proccesResults(response.data);
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:refresh', 'resolved', _this, response);
        $q.allSettled(results.included.map(synchronizeIncluded)).then(resolveIncluded, deferred.reject);

        _this.synchronized = true;
        _this.stable = true;
        _this.pristine = false;

        response.finish();
        _this.errors.synchronization.concat(response.errors);

        function synchronizeIncluded(object) {
          __incrementLoadingCounter(object);

          return object.synchronize({
            action: 'include',
            object: object
          }).finally(__decrementLoadingCounter.bind(object, undefined));
        }

        function resolveIncluded(includedResponse) {
          angular.forEach(includedResponse, function(operation, key) {
            if (operation.success === true) {
              $rootScope.$emit('angularJsonAPI:' + results.included[key].data.type + ':object:include', 'resolved', results.included[key], operation);
              operation.value.finish();
            }
          });

          deferred.resolve(response.data.meta);
        }
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:refresh', 'rejected', _this, response);

        response.finish();
        _this.errors.synchronization.concat(response.errors);
        deferred.reject(_this);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:refresh', 'notify', _this, response);

        deferred.notify(response);
      }
    }

    /**
     * Encodes object into json
     * @return {json} Json object
     */
    function toJson() {
      var _this = this;
      var data = _this.data;
      var relationships = {};

      angular.forEach(data.relationships, function(value, key) {
        if (value.data !== undefined) {
          relationships[key] = value;
        }
      });

      data.relationships = relationships;

      return {
        data: data,
        updatedAt: _this.updatedAt
      };
    }

    /**
     * Remove object
     * @return {promise} Promise associated with synchronization that resolves to nothing
     */
    function remove() {
      var _this = this;
      var deferred = $q.defer();

      var config = {
        action: 'remove',
        object: _this
      };

      _this.resource.cache.remove(_this.data.id);

      if (_this.new === true) {
        deferred.resolve();
      } else {
        __incrementSavingCounter(_this);

        _this.synchronize(config)
          .then(resolve, reject, notify)
          .finally(__decrementSavingCounter.bind(_this, undefined));
      }

      return deferred.promise;

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:remove', 'resolved', _this, response);
        _this.removed = true;
        _this.unlinkAll();
        _this.resource.cache.clearRemoved(_this.data.id);

        response.finish();
        _this.errors.synchronization.concat(response.errors);

        deferred.resolve();
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:remove', 'rejected', _this, response);
        _this.resource.cache.revertRemove(_this.data.id);

        response.finish();
        _this.errors.synchronization.concat(response.errors);
        deferred.reject(_this);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:remove', 'notify', _this, response);

        deferred.notify(response);
      }
    }

    /**
     * Unlink all reflection relationships of the object **without synchronization**
     * @return {boolean} Result
     */
    function unlinkAll(key) {
      var _this = this;
      var deferred = $q.defer();

      __incrementLoadingCounter(_this);

      if (key === undefined) {
        angular.forEach(_this.relationships, removeLink);
      } else {
        removeLink(_this.relationships[key], key);
      }

      __decrementLoadingCounter(_this);

      return deferred.promise;

      function removeLink(linksObj, key) {
        var schema = _this.schema.relationships[key];
        var reflectionKey = schema.reflection;

        if (angular.isArray(linksObj)) {
          angular.forEach(linksObj, removeReflectionLink.bind(undefined, reflectionKey));
        } else if (angular.isObject(linksObj)) {
          removeReflectionLink(reflectionKey, linksObj);
        }

        if (schema.type === 'hasOne') {
          _this.relationships[key] = null;
        } else if (schema.type === 'hasMany') {
          _this.relationships[key] = [];
        }
      }

      function removeReflectionLink(reflectionKey, target) {
        var reflectionSchema = target.schema.relationships[reflectionKey];
        var config = {
          action: 'unlinkReflection',
          object: target,
          target: _this,
          key: reflectionKey
        };

        __incrementLoadingCounter(target);
        AngularJsonAPIModelLinkerService.unlink(target, reflectionKey, _this, reflectionSchema);

        target.synchronize(config)
          .then(resolve, reject, notify)
          .finally(__decrementLoadingCounter.bind(target, undefined));

        function resolve(response) {
          $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlinkReflection', 'resolve', _this, response);

          response.finish();
          _this.errors.synchronization.concat(response.errors);
          deferred.resolve();
        }

        function reject(response) {
          $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlinkReflection', 'rejected', _this, response);

          response.finish();
          _this.errors.synchronization.concat(response.errors);
          deferred.reject(_this);
        }

        function notify(response) {
          $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlinkReflection', 'notify', _this, response);

          response.finish();
          deferred.notify(response);
        }
      }
    }

    /**
     * Links object to relationship with the key
     * @param  {string} key    Relationship name
     * @param  {AngularJsonAPIModel} target Object to be linked
     * @return {promise}        Promise associated with synchronizations
     */
    function link(key, target) {
      var deferred = $q.defer();
      var _this = this;
      var error;
      var config = {
        action: 'link',
        object: _this,
        target: target,
        key: key
      };

      if (target === undefined) {
        error = AngularJsonAPIModelSourceError.create('Can\'t link undefined', null, 0, 'link');
        _this.errors.synchronization.add('link', error);
        deferred.reject(error);
      } else if (_this.new === true) {
        error = AngularJsonAPIModelSourceError.create('Can\'t link new object', null, 0, 'link');
        _this.errors.synchronization.add('link', error);
        deferred.reject(error);
      } else {
        __incrementSavingCounter(_this);

        _this.synchronize(config)
          .then(resolve, reject, notify)
          .finally(__decrementSavingCounter.bind(_this, undefined));
      }

      return deferred.promise;

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:link', 'resolved', _this, response);

        var targets = AngularJsonAPIModelLinkerService.link(_this, key, target);

        _this.stable = true;
        _this.pristine = false;
        response.finish();
        _this.errors.synchronization.concat(response.errors);

        $q.allSettled(targets.map(synchronize))
          .then(resolveReflection, deferred.reject);

        function synchronize(result) {
          __incrementLoadingCounter(target);

          return target.synchronize({
            action: 'linkReflection',
            object: result.object,
            target: result.target,
            key: result.key
          }).finally(__decrementLoadingCounter.bind(target, undefined));
        }

        function resolveReflection(response) {
          angular.forEach(response, function(operation, key) {
            if (operation.success === true) {
              $rootScope.$emit('angularJsonAPI:' + targets[key].object.data.type + ':object:linkReflection', 'resolved', targets[key], operation);
              operation.value.finish();
            }
          });

          deferred.resolve(response.data.meta);
        }
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:link', 'rejected', _this, response);

        deferred.reject(response.errors);
        response.finish();
        _this.errors.synchronization.concat(response.errors);
        deferred.reject(_this);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:link', 'notify', _this, response);

        deferred.notify(response);
      }
    }

    /**
     * Unlinks object from relationship with the key
     * @param  {string} key    Relationship name
     * @param  {AngularJsonAPIModel} target Object to be unlinked if undefined unlinks all
     * @return {promise}        Promise associated with synchronizations
     */
    function unlink(key, target) {
      var deferred = $q.defer();
      var _this = this;
      var error;
      var config = {
        action: 'unlink',
        object: _this,
        target: target,
        key: key
      };

      if (target === undefined) {
        error = AngularJsonAPIModelSourceError.create('Can\'t unlink undefined', null, 0, 'unlink');
        _this.errors.synchronization.add('unlink', error);
        deferred.reject(_this);
      } else if (_this.new === true) {
        error = AngularJsonAPIModelSourceError.create('Can\'t unlink new object', null, 0, 'unlink');
        _this.errors.synchronization.add('unlink', error);
        deferred.reject(_this);
      } else {
        __incrementSavingCounter(_this);

        _this.synchronize(config)
          .then(resolve, reject, notify)
          .finally(__decrementSavingCounter.bind(_this, undefined));
      }

      return deferred.promise;

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlink', 'resolved', _this, response);

        var targets = AngularJsonAPIModelLinkerService.link(_this, key, target);

        _this.stable = true;
        _this.pristine = false;
        response.finish();
        _this.errors.synchronization.concat(response.errors);

        $q.allSettled(targets.map(synchronize))
          .then(resolveReflection, deferred.reject);

        function synchronize(result) {
          __incrementLoadingCounter(target);

          return target.synchronize({
            action: 'unlinkReflection',
            object: result.object,
            target: result.target,
            key: result.key
          }).finally(__decrementLoadingCounter.bind(target, undefined));
        }

        function resolveReflection(response) {
          angular.forEach(response, function(operation) {
            if (operation.success === true) {
              $rootScope.$emit('angularJsonAPI:' + targets[key].data.type + ':object:unlinkReflection', 'resolved', targets[key], operation);
              response.value.finish();
            }
          });

          deferred.resolve();
        }
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlink', 'rejected', _this, response);

        deferred.reject(response.errors);
        response.finish();
        _this.errors.synchronization.concat(response.errors);
        deferred.reject(_this);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlink', 'notify', _this, response);

        deferred.notify(response);
      }
    }

    /**
     * Sets object state to data
     * @param  {object} validatedData JsonAPI object with data
     * @return {bool}               Result
     */
    function update(validatedData, auto, initialization) {
      var _this = this;

      __incrementLoadingCounter(_this);

      __setData(_this, validatedData);
      _this.reset(auto);
      _this.synchronized = initialization === true ? false : true;
      _this.stable = initialization === true ? false : true;
      _this.updatedAt = Date.now();

      __decrementLoadingCounter(_this);
    }

    /**
     * Check if the object has errors
     * @return {Boolean}
     */
    function hasErrors() {
      var _this = this;
      var answer = false;

      angular.forEach(_this.errors, function(error) {
        answer = error.hasErrors() || answer;
      });

      return answer;
    }

    /////////////
    // PRIVATE //
    /////////////

    /**
     * Low level set data function, use only with validated data
     * @param  {AngularJsonAPIModel} object        object to be modified
     * @param  {object} validatedData Validated data
     * @return {boolean}               Status
     */
    function __setData(object, validatedData) {

      var $jsonapi = $injector.get('$jsonapi');
      var schema = object.schema;

      object.data.id = validatedData.id;
      object.data.type = validatedData.type;

      if (object.resource.schema.type !== validatedData.type) {
        $log.error('Different type then resource', object.resource.schema.type, validatedData);
        return false;
      }

      if (!object.schema.id.validate(object.data.id)) {
        $log.error('Invalid id');
        return false;
      }

      object.data.links = validatedData.links;
      validatedData.attributes = validatedData.attributes || {};
      validatedData.relationships = validatedData.relationships || {};

      angular.forEach(schema.attributes, setAttributes);
      angular.forEach(schema.relationships, setRelationships);

      return true;

      function setAttributes(validators, key) {
        object.data.attributes[key] = validatedData.attributes[key];
      }

      function setRelationships(schema, key) {
        var relationshipData = validatedData.relationships[key];

        if (relationshipData === undefined) {
          if (object.data.relationships[key] === undefined) {
            object.data.relationships[key] = {data: undefined};
          }

          return;
        }

        object.data.relationships[key] = object.data.relationships[key] || {};
        object.data.relationships[key].links = relationshipData.links;

        if (schema.type === 'hasOne') {
          linkOne(object, key, relationshipData.data);
        } else if (schema.type === 'hasMany') {
          if (angular.isArray(relationshipData.data)) {
            if (relationshipData.data.length === 0) {
              object.data.relationships[key].data = [];
              object.unlinkAll(key);
            } else {
              angular.forEach(
                object.relationships[key],
                unlinkOne.bind(undefined, object, key, relationshipData.data)
              );
              angular.forEach(
                relationshipData.data,
                linkOne.bind(undefined, object, key)
              );
            }
          }
        }
      }

      function linkOne(object, key, data) {
        var resource;

        if (data === null) {
          AngularJsonAPIModelLinkerService.link(object, key, null);
          return;
        }

        if (data === undefined) {
          return;
        }

        resource = $jsonapi.getResource(data.type);

        if (resource === undefined) {
          $log.error('Factory not found', data.type, data);
          return;
        }

        var target = resource.cache.get(data.id);

        AngularJsonAPIModelLinkerService.link(object, key, target);
      }

      function unlinkOne(object, key, relationshipData, target) {
        if (relationshipData.indexOf(target.data.id) > -1) {
          return;
        }

        AngularJsonAPIModelLinkerService.unlink(object, key, target);
      }
    }
  }
  AngularJsonAPIAbstractModelWrapper.$inject = ["AngularJsonAPIModelSourceError", "AngularJsonAPIModelValidationError", "AngularJsonAPIModelErrorsManager", "AngularJsonAPIModelLinkerService", "AngularJsonAPIModelForm", "$rootScope", "$injector", "$log", "$q"];

  /////////////
  // Private //
  /////////////

  function __incrementLoadingCounter(object) {
    object = object === undefined ? this : object;
    object.loadingCount += 1;
    object.loading = true;
  }

  function __decrementLoadingCounter(object) {
    object = object === undefined ? this : object;
    object.loadingCount -= 1;
    object.loading = object.loadingCount > 0;
  }

  function __incrementSavingCounter(object) {
    object = object === undefined ? this : object;
    object.savingCount += 1;
    object.saving = true;
  }

  function __decrementSavingCounter(object) {
    object = object === undefined ? this : object;
    object.savingCount -= 1;
    object.saving = object.savingCount > 0;
  }
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModelValidationError', AngularJsonAPIModelValidationErrorWrapper);

  function AngularJsonAPIModelValidationErrorWrapper() {
    ValidationError.prototype = Object.create(Error.prototype);
    ValidationError.prototype.constructor = ValidationError;
    ValidationError.prototype.name = 'ValidationError';

    return {
      create: ValidationErrorFactory
    };

    function ValidationErrorFactory(message, attribute) {
      return new ValidationError(message, attribute);
    }

    function ValidationError(message, attribute) {
      var _this = this;

      _this.message = message;
      _this.context = {
        attribute: attribute
      };
    }
  }
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModelSourceError', AngularJsonAPIModelSourceErrorWrapper);

  function AngularJsonAPIModelSourceErrorWrapper() {
    SourceError.prototype = Object.create(Error.prototype);
    SourceError.prototype.constructor = SourceError;
    SourceError.prototype.name = 'SourceError';

    return {
      create: SourceErrorFactory
    };

    function SourceErrorFactory(message, source, code, action) {
      return new SourceError(message, source, code, action);
    }

    function SourceError(message, source, code, action) {
      var _this = this;

      _this.message = message;
      _this.context = {
        source: source,
        code: code,
        action: action
      };
    }
  }
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModelErrorsManager', AngularJsonAPIModelErrorsManagerWrapper);

  function AngularJsonAPIModelErrorsManagerWrapper() {
    ErrorsManager.prototype.constructor = ErrorsManager;
    ErrorsManager.prototype.concat = concat;
    ErrorsManager.prototype.clear = clear;
    ErrorsManager.prototype.add = add;
    ErrorsManager.prototype.hasErrors = hasErrors;

    return {
      create: ErrorsManagerFactory
    };

    function ErrorsManagerFactory(name, description, ErrorConstructor, defaultFilter) {
      return new ErrorsManager(name, description, ErrorConstructor, defaultFilter);
    }

    function ErrorsManager(name, description, ErrorConstructor, defaultFilter) {
      var _this = this;
      _this.name = name;
      _this.description = description;

      _this.ErrorConstructor = ErrorConstructor;
      _this.errors = {};
      _this.defaultFilter = defaultFilter || function() { return true; };
    }

    function clear(key) {
      var _this = this;

      if (key === undefined) {
        angular.forEach(_this.errors, function(obj, key) {
          _this.errors[key] = [];
        });
      } else {
        _this.errors[key] = [];
      }
    }

    function add(key, error) {
      var _this = this;

      _this.errors[key] = _this.errors[key] || [];
      _this.errors[key].push(error);
    }

    function concat(errors) {
      var _this = this;

      angular.forEach(errors, function(error) {
        _this.errors[error.key] = [];
      });

      angular.forEach(errors, function(error) {
        _this.errors[error.key].push(error.object);
      });

    }

    function hasErrors(key) {
      var _this = this;

      if (key === undefined) {
        var answer = false;

        angular.forEach(_this.errors, function(error) {
          answer = answer || error.length > 0;
        });

        return answer;
      } else {
        return _this.errors[key] !== undefined && _this.errors[key].length > 0;
      }
    }
  }
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
    .constant('namedFunction', namedFunction);

  function namedFunction(name, fn) {
    return new Function('fn',
      'return function ' + name + '(){ return fn.apply(this,arguments)}'
    )(fn);
  }
})();

// from https://www.sitepen.com/blog/2012/10/19/lazy-property-access/
(function() {
  'use strict';

  angular.module('angular-jsonapi')
    .constant('lazyProperty', function(target, propertyName, callback) {
      var result;
      var done;
      Object.defineProperty(target, propertyName, {
        get: function() { // Define the getter
          if (!done) {
            // We cache the result and only compute once.
            done = true;
            result = callback.call(target);
          }

          return result;
        },

        // Keep it enumerable and configurable, certainly not necessary.
        enumerable: true,
        configurable: true
      });
    });

})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
    .constant('toKebabCase', function(str) {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    });

})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .config(provide);

  function provide($provide) {
    $provide.decorator('$q', decorator);
  }
  provide.$inject = ["$provide"];

  function decorator($delegate) {
    var $q = $delegate;

    $q.allSettled = $q.allSettled || allSettled;

    function allSettled(promises, resolvedCallback, rejectedCallback) {
      // Implementation of allSettled function from Kris Kowal's Q:
      // https://github.com/kriskowal/q/wiki/API-Reference#promiseallsettled
      // by Michael Kropat from http://stackoverflow.com/a/27114615/1400432 slightly modified

      var wrapped = angular.isArray(promises) ? [] : {};

      angular.forEach(promises, function(promise, key) {
        if (!wrapped.hasOwnProperty(key)) {
          wrapped[key] = wrap(promise);
        }
      });

      return $q.all(wrapped);

      function wrap(promise) {
        return $q.resolve(promise)
          .then(function(value) {
            if (angular.isFunction(resolvedCallback)) {
              resolvedCallback(value);
            }

            return { success: true, value: value };
          },

          function(reason) {
            if (angular.isFunction(rejectedCallback)) {
              rejectedCallback(reason);
            }

            return { success: false, reason: reason };
          });
      }
    }

    return $q;
  }
  decorator.$inject = ["$delegate"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPISynchronizerSimple', AngularJsonAPISynchronizerSimpleWrapper);

  function AngularJsonAPISynchronizerSimpleWrapper(AngularJsonAPISynchronizerPrototype, $q, $log) {

    AngularJsonAPISynchronizerSimple.prototype = Object.create(AngularJsonAPISynchronizerPrototype.prototype);
    AngularJsonAPISynchronizerSimple.prototype.constructor = AngularJsonAPISynchronizerSimple;

    AngularJsonAPISynchronizerSimple.prototype.synchronize = synchronize;

    return {
      create: AngularJsonAPISynchronizerSimpleFactory
    };

    function AngularJsonAPISynchronizerSimpleFactory(sources) {
      return new AngularJsonAPISynchronizerSimple(sources);
    }

    function AngularJsonAPISynchronizerSimple(sources) {
      var _this = this;

      _this.state = {};

      AngularJsonAPISynchronizerPrototype.call(_this, sources);

      angular.forEach(sources, function(source) {
        source.synchronizer = _this;
      });
    }

    function synchronize(config) {
      var _this = this;
      var promises = [];
      var deferred = $q.defer();
      var action = config.action;

      AngularJsonAPISynchronizerPrototype.prototype.synchronize.call(_this, config);

      angular.forEach(_this.sources, function(source) {
        angular.forEach(source.beginHooks[action], function(hook) {
          deferred.notify({step: 'begin', data: hook.call(_this, config)});
        });
      });

      angular.forEach(_this.sources, function(source) {
        angular.forEach(source.beforeHooks[action], function(hook) {
          deferred.notify({step: 'before', data: hook.call(_this, config)});
        });
      });

      angular.forEach(_this.sources, function(source) {
        angular.forEach(source.synchronizationHooks[action], function(hook) {
          promises.push(hook.call(_this, config));
        });
      });

      $q.allSettled(promises, resolvedCallback, rejectedCallback).then(resolved, rejected);

      function resolvedCallback(value) {
        deferred.notify({step: 'synchronization', data: value});
      }

      function rejectedCallback(reason) {
        deferred.notify({step: 'synchronization', errors: reason});
      }

      function resolved(results) {
        _this.state[action] = _this.state[action] || {};
        _this.state[action].success = true;

        angular.forEach(results, function(result) {
          if (result.success === false) {
            _this.state[action].success = false;
          }
        });

        angular.forEach(_this.sources, function(source) {
          angular.forEach(source.afterHooks[action], function(hook) {
            deferred.notify({step: 'after', errors: hook.call(_this, config, results)});
          });
        });

        var data;
        var errors = [];

        angular.forEach(results, function(result) {
          if (result.success === true) {
            data = result.value;
          } else {
            errors.push({
              key: action,
              object: result.reason
            });
          }
        });

        if (errors.length > 0) {
          deferred.reject({data: data || {}, finish: finish, errors: errors});
        } else {
          deferred.resolve({data: data || {}, finish: finish, errors: errors});
        }
      }

      function finish() {
        angular.forEach(_this.sources, function(source) {
          angular.forEach(source.finishHooks[action], function(hook) {
            deferred.notify({step: 'finish', errors: hook.call(_this, config)});
          });
        });
      }

      function rejected(errors) {
        $log.error('All settled rejected! Something went wrong');

        deferred.reject({finish: angular.noop, errors: errors});
      }

      return deferred.promise;
    }
  }
  AngularJsonAPISynchronizerSimpleWrapper.$inject = ["AngularJsonAPISynchronizerPrototype", "$q", "$log"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPISynchronizerPrototype', AngularJsonAPISynchronizerPrototypeWrapper);

  function AngularJsonAPISynchronizerPrototypeWrapper($log) {

    AngularJsonAPISynchronizerPrototype.prototype.synchronize = synchronize;

    return AngularJsonAPISynchronizerPrototype;

    function AngularJsonAPISynchronizerPrototype(sources) {
      var _this = this;

      _this.sources = sources;
    }

    function synchronize(config) {
      var _this = this;

      $log.debug('Synchro Collection', _this.resource.schema.type, config);

      if (config.action === undefined) {
        $log.error('Can\'t synchronize undefined action', config);
      }
    }
  }
  AngularJsonAPISynchronizerPrototypeWrapper.$inject = ["$log"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPISourcePrototype', AngularJsonAPISourcePrototypeWrapper);

  function AngularJsonAPISourcePrototypeWrapper() {
    AngularJsonAPISourcePrototype.prototype.before = beforeSynchro;
    AngularJsonAPISourcePrototype.prototype.after = afterSynchro;
    AngularJsonAPISourcePrototype.prototype.begin = begin;
    AngularJsonAPISourcePrototype.prototype.finish = finish;
    AngularJsonAPISourcePrototype.prototype.synchronization = synchronization;

    return AngularJsonAPISourcePrototype;

    function AngularJsonAPISourcePrototype(name) {
      var _this = this;
      var allHooks = [
        'add',
        'init',
        'get',
        'all',
        'clearCache',
        'remove',
        'unlink',
        'unlinkReflection',
        'link',
        'linkReflection',
        'update',
        'refresh',
        'include'
      ];

      _this.name = name;
      _this.state = {};

      _this.beginHooks = {};
      _this.beforeHooks = {};
      _this.synchronizationHooks = {};
      _this.afterHooks = {};
      _this.finishHooks = {};

      _this.options = {};

      angular.forEach(allHooks, function(hookName) {
        _this.beginHooks[hookName] = [];
        _this.beforeHooks[hookName] = [];
        _this.synchronizationHooks[hookName] = [];
        _this.afterHooks[hookName] = [];
        _this.finishHooks[hookName] = [];
        _this.state[hookName] = {
          loading: false,
          success: true
        };
      });
    }

    function begin(action, callback) {
      var _this = this;

      _this.beginHooks[action].push(callback);
    }

    function finish(action, callback) {
      var _this = this;

      _this.finishHooks[action].push(callback);
    }

    function beforeSynchro(action, callback) {
      var _this = this;

      _this.beforeHooks[action].push(callback);
    }

    function afterSynchro(action, callback) {
      var _this = this;

      _this.afterHooks[action].push(callback);
    }

    function synchronization(action, callback) {
      var _this = this;

      _this.synchronizationHooks[action].push(callback);
    }

  }
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPISchema', AngularJsonAPISchemaWrapper);

  function AngularJsonAPISchemaWrapper(
    $log,
    pluralize,
    uuid4,
    AngularJsonAPISchemaLink
  ) {

    return {
      create: AngularJsonAPISchemaFactory
    };

    function AngularJsonAPISchemaFactory(schema) {
      return new AngularJsonAPISchema(schema);
    }

    function AngularJsonAPISchema(schema) {
      var _this = this;
      var include = schema.include || {};
      schema.include = include;
      include.get = schema.include.get || [];
      include.all = schema.include.all || [];

      _this.params = {
        get: {},
        all: {}
      };

      if (schema.id === 'uuid4') {
        schema.id = uuid4;
      } else if (schema.id === 'int') {
        schema.id = {
          generate: angular.noop,
          validate: angular.isNumber
        };
      } else if (angular.isObject(schema.id)) {
        if (!angular.isFunction(schema.id.generate)) {
          schema.id.generate = angular.noop;
        }
      } else {
        schema.id = {
          generate: angular.noop,
          validate: angular.identity.bind(null, true)
        };
      }

      angular.forEach(schema.relationships, function(linkSchema, linkName) {
        var linkSchemaObj = AngularJsonAPISchemaLink.create(linkSchema, linkName, schema.type);
        schema.relationships[linkName] = linkSchemaObj;
        if (linkSchemaObj.included === true) {
          include.get.push(linkName);
          if (linkSchemaObj.type === 'hasOne') {
            include.all.push(linkName);
          }
        }
      });

      angular.extend(_this, schema);

      if (include.get.length > 0) {
        _this.params.get.include = include.get;
      }

      if (include.all.length > 0) {
        _this.params.all.include = include.all;
      }
    }

  }
  AngularJsonAPISchemaWrapper.$inject = ["$log", "pluralize", "uuid4", "AngularJsonAPISchemaLink"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPISchemaLink', AngularJsonAPILinkSchrapperLink);

  function AngularJsonAPILinkSchrapperLink($log, pluralize) {

    return {
      create: AngularJsonAPISchemaLinkFactory
    };

    function AngularJsonAPISchemaLinkFactory(linkSchema, linkName, type) {
      return new AngularJsonAPISchemaLink(linkSchema, linkName, type);
    }

    function AngularJsonAPISchemaLink(linkSchema, linkName, type) {
      var _this = this;

      if (angular.isString(linkSchema)) {
        _this.model = pluralize.plural(linkName);
        _this.type = linkSchema;
        _this.polymorphic = false;
        _this.reflection = type;
      } else {
        if (linkSchema.type === undefined) {
          $log.error('Schema of link without a type: ', linkSchema, linkName);
        }

        if (linkSchema.type !== 'hasMany' && linkSchema.type !== 'hasOne') {
          $log.error('Schema of link with wrong type: ', linkSchema.type, 'available: hasOne, hasMany');
        }

        _this.model = linkSchema.model || pluralize.plural(linkName);
        _this.type = linkSchema.type;
        _this.polymorphic = linkSchema.polymorphic || false;

        if (linkSchema.reflection === undefined) {
          _this.reflection = _this.type === 'hasMany' ? pluralize.singular(type) : type;
        } else {
          _this.reflection = linkSchema.reflection;
        }

        _this.included = linkSchema.included || false;
      }
    }

  }
  AngularJsonAPILinkSchrapperLink.$inject = ["$log", "pluralize"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIResource', AngularJsonAPIResourceWrapper);

  function AngularJsonAPIResourceWrapper(
    AngularJsonAPIModel,
    AngularJsonAPISchema,
    AngularJsonAPIResourceCache,
    AngularJsonAPICollection,
    $rootScope,
    $log,
    $q
  ) {
    AngularJsonAPIResource.prototype.get = get;
    AngularJsonAPIResource.prototype.all = all;
    AngularJsonAPIResource.prototype.remove = remove;
    AngularJsonAPIResource.prototype.initialize = initialize;

    AngularJsonAPIResource.prototype.clearCache = clearCache;

    return {
      create: AngularJsonAPIResourceFactory
    };

    function AngularJsonAPIResourceFactory(schema, synchronizer) {
      return new AngularJsonAPIResource(schema, synchronizer);
    }

    /**
     * AngularJsonAPIResource constructor
     * @param {json} schema       Schema object
     * @param {AngularJsonAPISynchronizer} synchronizer Synchronizer for the resource
     */
    function AngularJsonAPIResource(schema, synchronizer) {
      var _this = this;
      var config = {
        action: 'init'
      };

      _this.schema = AngularJsonAPISchema.create(schema);
      _this.cache = AngularJsonAPIResourceCache.create(_this);

      _this.synchronizer = synchronizer;
      _this.synchronizer.resource = _this;

      _this.modelFactory = AngularJsonAPIModel.modelFactory(
        _this.schema,
        _this
      );

      _this.initialized = false;
      _this.type = _this.schema.type;

      synchronizer.resource = _this;

      _this.synchronizer.synchronize(config).then(resolve, reject, notify);

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':resource:init', 'resolved', response);
        _this.cache.fromJson(response.data);
        _this.initialized = true;

        response.finish();
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':resource:init', 'rejected', response);
        response.finish();
        _this.initialized = true;
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':resource:init', 'notify', response);
      }
    }

    /**
     * Get request
     * @param  {uuid} id
     * @return {AngularJsonAPIModel} Model associated with id, synchronized
     */
    function get(id, params) {
      var _this = this;

      if (!_this.schema.id.validate(id)) {
        return $q.reject({errors: [{status: 0, statusText: 'Invalid id'}]});
      }

      var object = _this.cache.get(id);

      object.promise = object.refresh(params);

      return object;
    }

    /**
     * All request
     * @param  {object} params Object associated with params (for filters/pagination etc.)
     * @return {AngularJsonAPICollection} Collection of AngularJsonAPIModel, synchronized
     */
    function all(params) {
      var _this = this;
      params = angular.extend({}, _this.schema.params.all, params);

      var collection = AngularJsonAPICollection.create(
        _this,
        params
      );

      collection.promise = collection.fetch();

      return collection;
    }

    /**
     * Remove request
     * @param  {uuid} id
     * @return {promise} Promise associated with the synchronization, in case of
     * fail object is reverted to previous state
     */
    function remove(id) {
      var _this = this;
      var object = _this.cache.remove(id);

      return object.remove();
    }

    /**
     * Initialize new AngularJsonAPIModel
     * @return {AngularJsonAPIModel} New model
     */
    function initialize() {
      var _this = this;
      var relationships = {};

      angular.forEach(_this.schema.relationships, function(relationshipSchema, relationshipName) {
        if (relationshipSchema.type === 'hasOne') {
          relationships[relationshipName] = {
            data: null
          };
        } else if (relationshipSchema.type === 'hasMany') {
          relationships[relationshipName] = {
            data: []
          };
        }
      });

      var data = {
        type: _this.type,
        id: _this.schema.id.generate(),
        attributes: {},
        relationships: relationships
      };

      var config = {
        new: true,
        synchronized: false,
        stable: false,
        pristine: false,
        initialization: false
      };

      var object = _this.modelFactory(data, config);

      $rootScope.$emit('angularJsonAPI:' + _this.type + ':resource:initialize', 'resolved', object);

      return object;
    }

    /**
     * Clears localy saved data
     * @return {promise} Promise associated with the synchronization resolves to nothing
     */
    function clearCache() {
      var _this = this;
      var deferred = $q.defer();
      var config = {
        action: 'clearCache'
      };

      _this.cache.clear();

      _this.synchronizer.synchronize(config).then(resolve, reject, notify);

      return deferred;

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':resource:clearCache', 'resolved', response);
        response.finish();

        deferred.resolve(response);
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':resource:clearCache', 'resolved', response);
        response.finish();

        deferred.reject(response);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':resource:clearCache', 'notify', response);

        deferred.notify(response);
      }
    }
  }
  AngularJsonAPIResourceWrapper.$inject = ["AngularJsonAPIModel", "AngularJsonAPISchema", "AngularJsonAPIResourceCache", "AngularJsonAPICollection", "$rootScope", "$log", "$q"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModel', AngularJsonAPIModel);

  function AngularJsonAPIModel(
    AngularJsonAPIAbstractModel,
    AngularJsonAPISchema,
    namedFunction,
    pluralize,
    $log
  ) {

    return {
      modelFactory: createModelFactory
    };

    function createModelFactory(schemaObj, resource) {
      var constructorName = pluralize.plural(schemaObj.type, 1);

      var Model = namedFunction(constructorName, function(data, config, updatedAt) {
        var _this = this;

        if (data.type !== _this.schema.type) {
          $log.error('Data type other then declared in schema: ', data.type, ' instead of ', _this.schema.type);
        }

        AngularJsonAPIAbstractModel.call(_this, data, config, updatedAt);

        _this.form.parent = _this;
      });

      Model.prototype = Object.create(AngularJsonAPIAbstractModel.prototype);
      Model.prototype.constructor = Model;

      Model.prototype.schema = schemaObj;
      Model.prototype.resource = resource;
      Model.prototype.synchronize = resource.synchronizer.synchronize.bind(resource.synchronizer);

      angular.forEach(schemaObj.functions, function(metaFunction, metaFunctionName) {
        Model.prototype[metaFunctionName] = function() {
          return metaFunction.apply(this, arguments);
        };
      });

      return modelFactory;

      function modelFactory(data, updatedAt, isNew) {
        return new Model(data, updatedAt, isNew);
      }
    }
  }
  AngularJsonAPIModel.$inject = ["AngularJsonAPIAbstractModel", "AngularJsonAPISchema", "namedFunction", "pluralize", "$log"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPICollection', AngularJsonAPICollectionWrapper);

  function AngularJsonAPICollectionWrapper(
    AngularJsonAPIModelSourceError,
    AngularJsonAPIModelErrorsManager,
    $rootScope,
    $injector,
    $q
  ) {

    AngularJsonAPICollection.prototype.fetch = fetch;
    AngularJsonAPICollection.prototype.refresh = fetch;
    AngularJsonAPICollection.prototype.get = get;
    AngularJsonAPICollection.prototype.hasErrors = hasErrors;

    return {
      create: AngularJsonAPICollectionFactory
    };

    function AngularJsonAPICollectionFactory(resource, params) {
      return new AngularJsonAPICollection(resource, params);
    }

    /**
     * Constructor
     * @param {AngularJsonAPIResource} resource Factory associated with the collection
     * @param {object} params  Params associated with this resource (such as filters)
     */
    function AngularJsonAPICollection(resource, params) {
      var _this = this;

      _this.resource = resource;
      _this.type = resource.schema.type;
      _this.params = params || {};

      _this.errors = {
        synchronization: AngularJsonAPIModelErrorsManager.create(
          'Source',
          'Errors of synchronizations',
          AngularJsonAPIModelSourceError
        )
      };

      _this.data = _this.resource.cache.index(_this.params);

      _this.loading = false;
      _this.loadingCount = 0;
      _this.synchronized = false;
      _this.pristine = _this.data === undefined;

      _this.promise = $q.resolve(_this);

      var onObjectRemove = $rootScope.$on('angularJsonAPI:' + _this.type + ':object:remove', remove);
      var onFactoryClear = $rootScope.$on('angularJsonAPI:' + _this.type + ':resource:clearCache', clear);
      var onObjectAdd = $rootScope.$on('angularJsonAPI:' + _this.type + ':object:add', add);

      $rootScope.$on('$destroy', clearWatchers);

      function remove(event, status, object) {
        var index;

        if (status === 'resolved' && _this.data !== undefined) {
          index = _this.data.indexOf(object);
          if (index > -1) {
            _this.data.splice(index, 1);
            _this.resource.cache.setIndexIds(_this.data);
          }
        }
      }

      function clear() {
        _this.data = undefined;
        _this.pristine = true;
      }

      function add(event, status, object) {
        if (status === 'resolved') {
          _this.data = _this.data || [];
          _this.data.push(object);
        }
      }

      function clearWatchers() {
        onObjectRemove();
        onFactoryClear();
        onObjectAdd();
      }
    }

    /**
     * Check if the object has errors
     * @return {Boolean}
     */
    function hasErrors() {
      var _this = this;
      var answer = false;

      angular.forEach(_this.errors, function(error) {
        answer = error.hasErrors() || answer;
      });

      return answer;
    }

    /**
     * Shortcut to this.resource.get
     * @param  {string} id Id of object]
     * @return {AngularJsonAPIModel}          Model with id
     */
    function get(id, params) {
      var _this = this;

      return _this.resource.get(id, params);
    }

    /**
     * Synchronizes collection with the server
     * @return {promise} Promise associated with synchronization that resolves to this
     */
    function fetch() {
      var _this = this;
      var deferred = $q.defer();
      var $jsonapi = $injector.get('$jsonapi');
      var config = {
        action: 'all',
        params: _this.params
      };

      __incrementLoadingCounter(_this);

      angular.forEach(_this.data, __incrementLoadingCounter);

      _this.resource.synchronizer.synchronize(config)
        .then(resolve, reject, notify)
        .finally(__decrementLoadingCounter.bind(_this, undefined));

      return deferred.promise;

      function resolve(response) {
        var results = $jsonapi.__proccesResults(response.data);
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':collection:fetch', 'resolved', _this, response);
        $q.allSettled(results.included.map(synchronizeIncluded)).then(resolveIncluded, deferred.reject);

        angular.forEach(_this.data, __decrementLoadingCounter);

        _this.data = results.data;
        _this.links = response.data.links;

        _this.updatedAt = Date.now();
        _this.synchronized = true;
        _this.pristine = false;

        _this.resource.cache.setIndexIds(_this.data);
        response.finish();
        _this.errors.synchronization.concat(response.errors);

        function synchronizeIncluded(object) {
          __incrementLoadingCounter(object);

          return object.synchronize({
            action: 'include',
            object: object
          }).finally(__decrementLoadingCounter.bind(object, undefined));
        }

        function resolveIncluded(includedResponse) {
          angular.forEach(includedResponse, function(operation, key) {
            if (operation.success === true) {
              $rootScope.$emit('angularJsonAPI:' + results.included[key].data.type + ':object:include', 'resolved', results.included[key], operation);

              operation.value.finish();
            }
          });

          deferred.resolve(response.data.meta);
        }
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':collection:fetch', 'rejected', _this, response);

        angular.forEach(_this.data, __decrementLoadingCounter);
        response.finish();
        _this.errors.synchronization.concat(response.errors);
        deferred.reject(_this);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':collection:fetch', 'notify', _this, response);

        deferred.notify(response);
      }
    }
  }
  AngularJsonAPICollectionWrapper.$inject = ["AngularJsonAPIModelSourceError", "AngularJsonAPIModelErrorsManager", "$rootScope", "$injector", "$q"];

  function __incrementLoadingCounter(object) {
    object = object === undefined ? this : object;
    object.loadingCount += 1;
    object.loading = true;
  }

  function __decrementLoadingCounter(object) {
    object = object === undefined ? this : object;
    object.loadingCount -= 1;
    object.loading = object.loadingCount > 0;
  }
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .provider('$jsonapi', jsonapiProvider);

  function jsonapiProvider(validateJS) {
    var memory = {};
    var names = [];
    this.$get = jsonapiFactory;

    function jsonapiFactory(
      $log,
      AngularJsonAPIResource,
      AngularJsonAPISynchronizerSimple
    ) {
      return {
        addResource: addResource,
        getResource: getResource,
        clearCache: clearCache,
        allResources: allResources,
        listResources: listResources,
        addValidator: addValidator,
        synchronizerSimple: AngularJsonAPISynchronizerSimple,

        __proccesResults: __proccesResults
      };

      function addResource(schema, synchronizer) {
        var resource = AngularJsonAPIResource.create(schema, synchronizer);

        memory[schema.type] = resource;
        names.push(schema.type);
      }

      function getResource(type) {
        return memory[type];
      }

      function allResources() {
        return memory;
      }

      function listResources() {
        return names;
      }

      function clearCache() {
        angular.forEach(memory, function(resource) {
          resource.clearCache();
        });
      }

      function addValidator(name, validator) {
        if (!angular.isString(name)) {
          $log.error('Validator name is not a string', name);
          return;
        } else if (validateJS.validators[name] === undefined) {
          $log.warn('Redeclaring validator', name);
        }

        validateJS.validators[name] = validator;
      }

      function __proccesResults(results) {
        var objects = {
          data: [],
          included: []
        };

        if (results === undefined) {
          $log.error('Can\'t proccess results:', results);
          return;
        }

        var config = {
          new: false,
          synchronized: true,
          stable: true,
          pristine: false,
          initialization: false
        };

        angular.forEach(results.included, function(data) {
          objects.included.push(getResource(data.type).cache.addOrUpdate(data, config));
        });

        if (angular.isArray(results.data)) {
          angular.forEach(results.data, function(data) {
            objects.data.push(getResource(data.type).cache.addOrUpdate(data, config));
          });
        } else if (results.data !== undefined) {
          objects.data.push(getResource(results.data.type).cache.addOrUpdate(results.data, config));
        }

        return objects;
      }
    }
    jsonapiFactory.$inject = ["$log", "AngularJsonAPIResource", "AngularJsonAPISynchronizerSimple"];
  }
  jsonapiProvider.$inject = ["validateJS"];

})();


(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .config(["$logProvider", function($logProvider) {
    $logProvider.debugEnabled(false);
  }])
  .run(["validateJS", "$q", function(validateJS, $q) {
    validateJS.Promise = $q;
  }]);
})();

//# sourceMappingURL=angular-jsonapi.js.map