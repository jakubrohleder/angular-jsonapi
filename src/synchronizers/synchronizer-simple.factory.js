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
})();
