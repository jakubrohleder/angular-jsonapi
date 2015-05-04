(function() {
  'use strict';

  angular.module('angularJsonapi')
  .constant('SYNCHRONIZATION_STATES', {
    IN_PROGRESS: 'in progress',
    SUCCESS: 'Success',
    FAILED: 'Failed'
  })
  .factory('AngularJsonAPISynchronization', AngularJsonAPISynchronizationWrapper);

  function AngularJsonAPISynchronizationWrapper($q, SYNCHRONIZATION_STATES) {
    AngularJsonAPISynchronization.prototype.before = before;
    AngularJsonAPISynchronization.prototype.after = after;
    AngularJsonAPISynchronization.prototype.synchronization = synchronization;
    AngularJsonAPISynchronization.prototype.synchronize = synchronize;

    return AngularJsonAPISynchronization;

    function AngularJsonAPISynchronization(parent) {
      var _this = this;

      _this.beforeHooks = {};
      _this.synchronizationHooks = {};
      _this.afterHooks = {};
      _this.state = {};

      _this.parent = parent;

    }

    function before(action, callback) {
      var _this = this;

      _this.beforeHooks[action] = _this.beforeHooks[action] || [];
      _this.beforeHooks[action].push(callback);
    }

    function after(action, callback) {
      var _this = this;

      _this.afterHooks[action] = _this.afterHooks[action] || [];
      _this.afterHooks[action].push(callback);
    }

    function synchronization(action, callback) {
      var _this = this;

      _this.synchronizationHooks[action] = _this.synchronizationHooks[action] || [];
      _this.synchronizationHooks[action].push(callback);
    }

    function synchronize(action, object) {
      var _this = this;

      _this.state[action] = SYNCHRONIZATION_STATES.IN_PROGRESS;
      angular.forEach(_this.beforeHooks[action], function(hook) {
        hook(_this.parent, object);
      });

      $q.allSettled(_this.synchronizationHooks[action]).then(function(results) {
        _this.state[action] = SYNCHRONIZATION_STATES.SUCCESS;
        angular.forEach(results, function(result) {
          if (result.success === false) {
            _this.state[action] = SYNCHRONIZATION_STATES.FAILED;
          }
        });

        angular.forEach(_this.afterHooks[action], function(hook) {
          hook(_this.parent, object, results);
        });
      });
    }

  }
})();
