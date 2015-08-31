(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPISynchronization', AngularJsonAPISynchronizationWrapper);

  function AngularJsonAPISynchronizationWrapper($q) {
    AngularJsonAPISynchronization.prototype.before = beforeSynchro;
    AngularJsonAPISynchronization.prototype.after = afterSynchro;
    AngularJsonAPISynchronization.prototype.begin = begin;
    AngularJsonAPISynchronization.prototype.finish = finish;
    AngularJsonAPISynchronization.prototype.synchronization = synchronization;
    AngularJsonAPISynchronization.prototype.synchronize = synchronize;
    AngularJsonAPISynchronization.prototype.extend = extend;

    return AngularJsonAPISynchronization;

    function AngularJsonAPISynchronization() {
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

    function extend(synchronization) {
      var _this = this;

      extendHooks('beginHooks');
      extendHooks('beforeHooks');
      extendHooks('synchronizationHooks');
      extendHooks('afterHooks');
      extendHooks('finishHooks');

      function extendHooks(hooksKey) {
        angular.forEach(synchronization[hooksKey], function(hooks, key) {
          _this[hooksKey][key] = _this[hooksKey][key].concat(hooks);
        });
      }

      angular.extend(_this.options, synchronization.options);
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

    function synchronize(action, collection, object, linkSchema, linkedObject, params) {
      var _this = this;
      var promises = [];
      var deferred = $q.defer();

      _this.state[action].loading = true;

      if (object !== undefined) {
        object.loadingCount += 1;
      }

      if (collection !== undefined) {
        collection.loadingCount += 1;
      }

      angular.forEach(_this.beginHooks[action], function(hook) {
        hook.call(_this, collection, object, linkSchema, linkedObject, params);
      });

      angular.forEach(_this.beforeHooks[action], function(hook) {
        hook.call(_this, collection, object, linkSchema, linkedObject, params);
      });

      angular.forEach(_this.synchronizationHooks[action], function(hook) {
        promises.push(hook.call(_this, collection, object, linkSchema, linkedObject, params));
      });

      $q.allSettled(promises).then(function(results) {
        _this.state[action].success = true;
        angular.forEach(results, function(result) {
          if (result.success === false) {
            _this.state[action].success = false;
          }
        });

        angular.forEach(_this.afterHooks[action], function(hook) {
          hook.call(_this, collection, object, linkSchema, linkedObject, params, results);
        });

        angular.forEach(_this.finishHooks[action], function(hook) {
          hook.call(_this, collection, object, linkSchema, linkedObject, params);
        });

        _this.state[action].loading = false;

        if (object !== undefined) {
          object.loadingCount -= 1;
        }

        if (collection !== undefined) {
          collection.loadingCount -= 1;
        }

        if (_this.state[action].success === true) {
          deferred.resolve(results);
        } else {
          deferred.reject(results);
        }

      },

      function(results) {
        deferred.reject(results);
      });

      return deferred.promise;
    }

  }
})();
