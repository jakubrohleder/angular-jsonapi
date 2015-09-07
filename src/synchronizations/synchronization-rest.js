(function() {
  'use strict';

  angular.module('angular-jsonapi-rest', ['angular-jsonapi'])
  .factory('AngularJsonAPISynchronizationRest', AngularJsonAPISynchronizationRestWrapper);

  function AngularJsonAPISynchronizationRestWrapper(
    AngularJsonAPISynchronizationPrototype,
    AngularJsonAPIModelLinkerService,
    toKebabCase,
    $q,
    $http
  ) {

    AngularJsonAPISynchronizationRest.prototype = Object.create(AngularJsonAPISynchronizationPrototype.prototype);
    AngularJsonAPISynchronizationRest.prototype.constructor = AngularJsonAPISynchronizationRest;

    return AngularJsonAPISynchronizationRest;

    function AngularJsonAPISynchronizationRest(url) {
      var _this = this;
      var headers = { // jscs:disable disallowQuotedKeysInObjects
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      }; // jscs:enable disallowQuotedKeysInObjects

      AngularJsonAPISynchronizationPrototype.call(_this);

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
          params: config.params || {}
        }).then(resolveHttp, rejectHttp);
      }

      function get(config) {
        return $http({
          method: 'GET',
          headers: headers,
          url: url + '/' + config.object.data.id,
          params: config.params || {}
        }).then(resolveHttp, rejectHttp);
      }

      function remove(config) {
        return $http({
          method: 'DELETE',
          headers: headers,
          url: url + '/' + config.object.data.id
        }).then(resolveHttp, rejectHttp);
      }

      function unlink(config) {
        var deferred = $q.defer();

        if (config.object.removed === true) {
          deferred.reject({errors: [{status: 0, statusText: 'Object has been removed'}]});
        } else if (config.target !== undefined && config.target.data.id === undefined) {
          deferred.reject({errors: [{status: 0, statusText: 'Can\'t unlink object without id through rest call'}]});
        } else if (config.schema.type === 'hasOne') {
          $http({
            method: 'DELETE',
            headers: headers,
            url: url + '/' + config.object.data.id + '/relationships/' + config.key
          }).then(resolveHttp, rejectHttp).then(deferred.resolve, deferred.reject);
        } else if (config.schema.type === 'hasMany') {
          if (config.target === undefined) {
            $http({
              method: 'PUT',
              headers: headers,
              data: {data: []},
              url: url + '/' + config.object.data.id + '/relationships/' + config.key
            }).then(resolveHttp, rejectHttp).then(deferred.resolve, deferred.reject);
          } else {
            $http({
              method: 'DELETE',
              headers: headers,
              url: url + '/' + config.object.data.id + '/relationships/' + config.key + '/' + config.target.data.id
            }).then(resolveHttp, rejectHttp).then(deferred.resolve, deferred.reject);
          }
        }

        return deferred.promise;
      }

      function link(config) {
        var deferred = $q.defer();

        if (config.object.removed === true) {
          deferred.reject({errors: [{status: 0, statusText: 'Object has been removed'}]});
        } else if (config.target === undefined || config.target.data.id === undefined) {
          deferred.reject({errors: [{status: 0, statusText: 'Can\'t link object without id through rest call'}]});
        } else if (config.schema.type === 'hasOne') {
          $http({
            method: 'PUT',
            headers: headers,
            data: {data: AngularJsonAPIModelLinkerService.toLinkData(config.target)},
            url: url + '/' + config.object.data.id + '/relationships/' + config.key
          }).then(resolveHttp, rejectHttp).then(deferred.resolve, deferred.reject);
        } else if (config.schema.type === 'hasMany') {
          $http({
            method: 'POST',
            headers: headers,
            data: {data: [AngularJsonAPIModelLinkerService.toLinkData(config.target)]},
            url: url + '/' + config.object.data.id + '/relationships/' + config.key + '/' + config.target.data.id
          }).then(resolveHttp, rejectHttp).then(deferred.resolve, deferred.reject);
        }

        return deferred.promise;
      }

      function update(config) {
        return $http({
          method: 'PUT',
          headers: headers,
          url: url + '/' + config.object.data.id,
          data: config.object.form.toJson()
        }).then(resolveHttp, rejectHttp);
      }

      function add(config) {
        return $http({
          method: 'POST',
          headers: headers,
          url: url + '/',
          data: config.object.form.toJson()
        }).then(resolveHttp, rejectHttp);
      }

      function resolveHttp(response) {
        return $q.resolve(response.data);
      }

      function rejectHttp(response) {
        var deferred = $q.defer();

        if (response.status === 0) {
          $http({
            method: 'GET',
            url: 'https://status.cloud.google.com/incidents.schema.json'
          }).then(rejectServerOffline, rejectNoConnection);
        } else {
          deferred.reject({status: response.status, statusText: response.statusText});
        }

        return deferred.promise;

        function rejectServerOffline() {
          deferred.reject({status: response.status, statusText: 'Server is offline'});
        }

        function rejectNoConnection() {
          deferred.reject({status: response.status, statusText: 'No internet connection'});
        }
      }
    }
  }
})();
