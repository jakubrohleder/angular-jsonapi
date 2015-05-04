(function() {
  'use strict';

  angular.module('angularJsonapiRest', ['angularJsonapi'])
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
      _this.after('all', afterAll);
      _this.after('get', afterGet);

      function wrapResp(data, status, headers, config) {
        return {
          data: data,
          status: status,
          headers: headers,
          config: config
        };
      }

      function afterAll(collection, object, linkSchema, linkedObject, results) {
        var rawData = results[0].value.data.data;

        if (results[0].success === true && rawData !== undefined) {
          var indexedData = {};
          angular.forEach(rawData, function(data) {
            indexedData[data.id] = data;
            collection.__add(data);
          });

          angular.forEach(collection.data, function(data) {
            if (indexedData[data.id] === undefined) {
              collection.__remove(data.id);
            }
          });
        }
      }

      function afterGet(collection, object, linkSchema, linkedObject, results) {
        var data = results[0].value.data;
        if (results[0].success === true && data !== undefined) {
          collection.__add(data);
        }
      }

      function all() {
        var deferred = $q.defer();
        var config = {
          method: 'GET',
          url: url
        };

        $http(config).
          success(function(data, status, headers, config) {
            deferred.resolve(wrapResp(data, status, headers, config));
          }).
          error(function(data, status, headers, config) {
            deferred.reject(wrapResp(data, status, headers, config));
          });

        return deferred.promise;
      }

      function get(collection, object) {
        var deferred = $q.defer();
        var config = {
          method: 'GET',
          url: url + '/' + object.data.id
        };

        $http(config).
          success(function(data, status, headers, config) {
            deferred.resolve(wrapResp(data, status, headers, config));
          }).
          error(function(data, status, headers, config) {
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

        $http(config).
          success(function(data, status, headers, config) {
            deferred.resolve(wrapResp(data, status, headers, config));
          }).
          error(function(data, status, headers, config) {
            deferred.reject(wrapResp(data, status, headers, config));
          });

        return deferred.promise;
      }

      function removeLink(collection, object, linkKey, linkedObject) {
        var deferred = $q.defer();
        var config;

        if (object.removed === true || linkedObject === undefined) {
          deferred.resolve();
        } else {
          config = {
            method: 'DELETE',
            url: url + '/' + object.data.id + '/links/' + linkKey,
            data: {data: linkedObject.toLink()}
          };

          $http(config).
          success(function(data, status, headers, config) {
            deferred.resolve(wrapResp(data, status, headers, config));
          }).
          error(function(data, status, headers, config) {
            deferred.reject(wrapResp(data, status, headers, config));
          });
        }

        return deferred.promise;
      }

      function addLink(collection, object, linkKey, linkedObject) {
        var deferred = $q.defer();
        var config = {
          method: 'POST',
          url: url + '/' + object.data.id + '/links/' + linkKey,
          data: {data: linkedObject.toLink()}
        };

        $http(config).
          success(function(data, status, headers, config) {
            deferred.resolve(wrapResp(data, status, headers, config));
          }).
          error(function(data, status, headers, config) {
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

        $http(config).
          success(function(data, status, headers, config) {
            deferred.resolve(wrapResp(data, status, headers, config));
          }).
          error(function(data, status, headers, config) {
            deferred.reject(wrapResp(data, status, headers, config));
          });

        return deferred.promise;
      }

      function add(collection, object) {
        var deferred = $q.defer();
        var config = {
          method: 'POST',
          url: url + '/' + object.data.id,
          data: {data: object.toJson()}
        };

        $http(config).
          success(function(data, status, headers, config) {
            deferred.resolve(wrapResp(data, status, headers, config));
          }).
          error(function(data, status, headers, config) {
            deferred.reject(wrapResp(data, status, headers, config));
          });

        return deferred.promise;
      }
    }
  }
})();
