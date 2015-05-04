(function() {
  'use strict';

  angular.module('angularJsonapi')
  .factory('AngularJsonAPISynchronization', AngularJsonAPISynchronizationWrapper);

  function AngularJsonAPISynchronizationWrapper($q) {
    AngularJsonAPISynchronization.prototype.before = beforeSynchro;
    AngularJsonAPISynchronization.prototype.after = afterSynchro;
    AngularJsonAPISynchronization.prototype.synchronization = synchronization;
    AngularJsonAPISynchronization.prototype.synchronize = synchronize;
    AngularJsonAPISynchronization.prototype.extend = extend;

    return AngularJsonAPISynchronization;

    function AngularJsonAPISynchronization(options) {
      var _this = this;
      var allHooks = [
        'add',
        'init',
        'get',
        'all',
        'clear',
        'remove',
        'removeLink',
        'removeLinkReflection',
        'addLink',
        'addLinkReflection',
        'update',
        'refresh'
      ];

      _this.state = {};
      _this.beforeHooks = {};
      _this.synchronizationHooks = {};
      _this.afterHooks = {};

      angular.forEach(allHooks, function(hookName) {
        _this.beforeHooks[hookName] = [];
        _this.synchronizationHooks[hookName] = [];
        _this.afterHooks[hookName] = [];
        _this.state[hookName] = {
          loading: false,
          success: true
        };
      });

      _this.options = options;
    }

    function extend(synchronization) {
      var _this = this;

      extendHooks('beforeHooks');
      extendHooks('synchronizationHooks');
      extendHooks('afterHooks');

      function extendHooks(hooksKey) {
        angular.forEach(synchronization[hooksKey], function(hooks, key) {
          _this[hooksKey][key].concat(hooks);
        });
      }

      angular.extend(_this.options, synchronization.options);
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

    function synchronize(action, collection, object) {
      var _this = this;

      _this.state[action].loading = true;
      angular.forEach(_this.beforeHooks[action], function(hook) {
        hook.call(_this, collection, object);
      });

      $q.allSettled(_this.synchronizationHooks[action]).then(function(results) {

        _this.state[action].success = true;
        angular.forEach(results, function(result) {
          if (result.success === false) {
            _this.state[action].success = false;
          }
        });

        angular.forEach(_this.afterHooks[action], function(hook) {
          hook.call(_this, collection, object, results);
        });

        _this.state[action].loading = false;
      });
    }

  }
})();
