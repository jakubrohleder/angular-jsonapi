(function() {
  'use strict';

  angular.module('angular-jsonapi-local', ['angular-jsonapi'])
  .factory('AngularJsonAPISynchronizerSimple', AngularJsonAPISynchronizerSimpleWrapper);

  function AngularJsonAPISynchronizerSimpleWrapper(AngularJsonAPISynchronizerPrototype, $q, $log) {

    AngularJsonAPISynchronizerSimple.prototype = Object.create(AngularJsonAPISynchronizerPrototype.prototype);
    AngularJsonAPISynchronizerSimple.prototype.constructor = AngularJsonAPISynchronizerSimple;

    AngularJsonAPISynchronizerSimple.prototype.synchronize = synchronize;

    return AngularJsonAPISynchronizerSimple;

    function AngularJsonAPISynchronizerSimple(synchronizations) {
      var _this = this;

      AngularJsonAPISynchronizerPrototype.call(_this, synchronizations);

      angular.forEach(synchronizations, function(synchronization) {
        synchronization.synchronizer = _this;
      });
    }

    function synchronize(config) {
      var _this = this;
      var promises = [];
      var deferred = $q.defer();
      var action = config.action;

      AngularJsonAPISynchronizerPrototype.synchronize.call(_this, config);

      angular.forEach(_this.synchronizations, function(synchronization) {
        angular.forEach(synchronization.beginHooks[action], function(hook) {
          deferred.notify('begin', hook.call(_this, config));
        });
      });

      angular.forEach(_this.synchronizations, function(synchronization) {
        angular.forEach(synchronization.beforeHooks[action], function(hook) {
          deferred.notify('before', hook.call(_this, config));
        });
      });

      angular.forEach(_this.synchronizations, function(synchronization) {
        angular.forEach(synchronization.synchronizationHooks[action], function(hook) {
          promises.push(hook.call(_this, config));
        });
      });

      $q.allSettled(promises, resolvedCallback, rejectedCallback).then(resolved, rejected);

      function resolvedCallback(value) {
        deferred.notify('synchronization', value);
      }

      function rejectedCallback(reason) {
        deferred.notify('synchronization', reason);
      }

      function resolved(results) {
        _this.state[action].success = true;

        angular.forEach(results, function(result) {
          if (result.success === false) {
            _this.state[action].success = false;
          }
        });

        angular.forEach(_this.synchronizations, function(synchronization) {
          angular.forEach(synchronization.afterHooks[action], function(hook) {
            deferred.notify('after', hook.call(_this, config, results));
          });
        });

        var data;
        var errors = [];

        angular.forEach(results, function(result) {
          if (result.success === true) {
            data = result.value;
          } else {
            errors.push(result.reason);
          }
        });

        if (data === undefined) {
          deferred.reject(data, finish, errors);
        } else {
          deferred.resolve(errors, finish);
        }
      }

      function finish() {
        angular.forEach(_this.synchronizations, function(synchronization) {
          angular.forEach(synchronization.finishHooks[action], function(hook) {
            deferred.notify('finish', hook.call(_this, config));
          });
        });
      }

      function rejected(results) {
        $log.error('All settled rejected! Something went wrong');

        deferred.reject(results);
      }

      return deferred.promise;
    }
  }
})();
