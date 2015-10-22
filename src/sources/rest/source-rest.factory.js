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
})();
