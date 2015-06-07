(function() {
  'use strict';

  angular.module('angular-jsonapi-rest', ['angular-jsonapi'])
  .factory('AngularJsonAPISynchronizationRest', AngularJsonAPISynchronizationRestWrapper);

  function AngularJsonAPISynchronizationRestWrapper(AngularJsonAPISynchronization, $q, $http) {

    AngularJsonAPISynchronizationRest.prototype = Object.create(AngularJsonAPISynchronization.prototype);
    AngularJsonAPISynchronizationRest.prototype.constructor = AngularJsonAPISynchronizationRest;

    return AngularJsonAPISynchronizationRest;

    function AngularJsonAPISynchronizationRest(url) {
      var _this = this;

      AngularJsonAPISynchronization.call(_this);

      _this.synchronization('remove', remove);
      _this.synchronization('removeLink', removeLink);
      _this.synchronization('addLink', addLink);
      _this.synchronization('update', update);
      _this.synchronization('add', add);
      _this.synchronization('all', all);
      _this.synchronization('get', get);
      _this.synchronization('refresh', get);
      _this.after('all', afterAll);
      _this.after('get', afterGet);
      _this.after('refresh', afterGet);

      function wrapResp(data, status, headers, config) {
        return {
          data: data,
          status: status,
          headers: headers,
          config: config
        };
      }

      function afterAll(collection, object, linkSchema, linkedObject, params, results) {
        var rawData;
        var included;
        var indexedData;

        if (results[0].success === true) {
          rawData = results[0].value.data.data;
          included = results[0].value.data.included;
          indexedData = {};
          angular.forEach(rawData, function(data) {
            indexedData[data.id] = data;
            collection.addOrUpdate(data);
          });

          angular.forEach(collection.data, function(data) {
            if (indexedData[data.id] === undefined) {
              collection.__remove(data.id);
            }
          });

          angular.forEach(included, function(object) {
            collection.allCollections[object.type].addOrUpdate(object);
          });
        }
      }

      function afterGet(collection, object, linkSchema, linkedObject, params, results) {
        var data;
        var included;

        if (results[0].success === true) {
          data = results[0].value.data.data;
          included = results[0].value.data.included;
          collection.addOrUpdate(data);

          angular.forEach(included, function(object) {
            collection.allCollections[object.type].addOrUpdate(object);
          });
        }
      }

      function all(collection, object, linkSchema, linkedObject, params) {
        var deferred = $q.defer();
        var config = {
          method: 'GET',
          url: url,
          params: params || {}
        };

        collection.errors.rest = collection.errors.rest || {};

        $http(config).
          success(function(data, status, headers, config) {
            collection.errors.rest.all = undefined;
            deferred.resolve(wrapResp(data, status, headers, config));
          }).
          error(function(data, status, headers, config) {
            collection.errors.rest.all = data;
            deferred.reject(wrapResp(data, status, headers, config));
          });

        return deferred.promise;
      }

      function get(collection, object, linkSchema, linkedObject, params) {
        var deferred = $q.defer();
        var config;
        var ids;

        if (angular.isArray(object)) {
          ids = [];
          angular.forEach(object, function(object) {
            ids.push(object.data.id);
          });
        } else {
          ids = object.data.id;
        }

        config = {
          method: 'GET',
          url: url + '/' + ids.toString(),
          params: params || {}
        };

        object.errors.rest = object.errors.rest || {};

        $http(config).
          success(function(data, status, headers, config) {
            object.errors.rest.get = undefined;
            deferred.resolve(wrapResp(data, status, headers, config));
          }).
          error(function(data, status, headers, config) {
            object.errors.rest.get = data;
            deferred.reject(wrapResp(data, status, headers, config));
          });

        return deferred.promise;
      }

      function remove(collection, object) {
        var deferred = $q.defer();
        var config = {
          method: 'DELETE',
          url: url + '/' + object.data.id
        };

        object.errors.rest = object.errors.rest || {};

        $http(config).
          success(function(data, status, headers, config) {
            object.errors.rest.remove = undefined;
            deferred.resolve(wrapResp(data, status, headers, config));
          }).
          error(function(data, status, headers, config) {
            object.errors.rest.remove = data;
            deferred.reject(wrapResp(data, status, headers, config));
          });

        return deferred.promise;
      }

      function removeLink(collection, object, linkKey, linkedObject) {
        var deferred = $q.defer();
        var config;

        object.errors.rest = object.errors.rest || {};

        if (object.removed === true || linkedObject === undefined) {
          deferred.resolve();
        } else {
          config = {
            method: 'DELETE',
            url: url + '/' + object.data.id + '/relationships/' + linkKey,
            data: {data: linkedObject.toLink()}
          };

          $http(config).
          success(function(data, status, headers, config) {
            object.errors.rest.removeLink = undefined;
            deferred.resolve(wrapResp(data, status, headers, config));
          }).
          error(function(data, status, headers, config) {
            object.errors.rest.removeLink = data;
            deferred.reject(wrapResp(data, status, headers, config));
          });
        }

        return deferred.promise;
      }

      function addLink(collection, object, linkKey, linkedObject) {
        var deferred = $q.defer();
        var config = {
          method: 'POST',
          url: url + '/' + object.data.id + '/relationships/' + linkKey,
          data: {data: linkedObject.toLink()}
        };

        object.errors.rest = object.errors.rest || {};

        $http(config).
          success(function(data, status, headers, config) {
            object.errors.rest.addLink = undefined;
            deferred.resolve(wrapResp(data, status, headers, config));
          }).
          error(function(data, status, headers, config) {
            object.errors.rest.addLink = data;
            deferred.reject(wrapResp(data, status, headers, config));
          });

        return deferred.promise;

      }

      function update(collection, object) {
        var deferred = $q.defer();
        var config = {
          method: 'PATCH',
          url: url + '/' + object.data.id,
          data: {data: object.toPatchData()}
        };

        object.errors.rest = object.errors.rest || {};

        $http(config).
          success(function(data, status, headers, config) {
            object.errors.rest.update = undefined;
            deferred.resolve(wrapResp(data, status, headers, config));
          }).
          error(function(data, status, headers, config) {
            object.errors.rest.update = data;
            deferred.reject(wrapResp(data, status, headers, config));
          });

        return deferred.promise;
      }

      function add(collection, object) {
        var deferred = $q.defer();
        var config = {
          method: 'POST',
          url: url + '/',
          data: {data: object.toJson()}
        };

        object.errors.rest = object.errors.rest || {};

        $http(config).
          success(function(data, status, headers, config) {
            object.errors.rest.add = undefined;
            deferred.resolve(wrapResp(data, status, headers, config));
          }).
          error(function(data, status, headers, config) {
            object.errors.rest.add = data;
            deferred.reject(wrapResp(data, status, headers, config));
          });

        return deferred.promise;
      }
    }
  }
})();
