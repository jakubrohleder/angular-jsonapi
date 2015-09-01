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
        });
      }

      function get(config) {
        return $http({
          method: 'GET',
          headers: headers,
          url: url + '/' + config.object.data.id,
          params: config.params || {}
        });
      }

      function remove(config) {
        return $http({
          method: 'DELETE',
          headers: headers,
          url: url + '/' + config.object.data.id
        });
      }

      function unlink(config) {
        var deferred = $q.defer();

        if (config.object.removed === true || config.target === undefined) {
          deferred.reject();
        } else {
          $http({
            method: 'DELETE',
            headers: headers,
            url: url + '/' + config.object.data.id + '/relationships/' + toKebabCase(config.key) + '/' + config.target.data.id
          }).then(deferred.resolve, deferred.reject);
        }

        return deferred.promise;
      }

      function link(config) {
        var deferred = $q.defer();

        if (config.object.removed === true || config.target === undefined) {
          deferred.reject();
        } else {
          $http({
            method: 'POST',
            headers: headers,
            url: url + '/' + config.object.data.id + '/relationships/' + toKebabCase(config.key),
            data: {data: [AngularJsonAPIModelLinkerService.toLinkData(config.target)]}
          }).then(deferred.resolve, deferred.reject);
        }

        return deferred.promise;
      }

      function update(config) {
        return $http({
          method: 'PUT',
          headers: headers,
          url: url + '/' + config.object.data.id,
          data: config.object.form.toJson()
        });
      }

      function add(config) {
        return $http({
          method: 'POST',
          headers: headers,
          url: url + '/',
          data: config.object.form.toJson()
        });
      }
    }
  }
})();
