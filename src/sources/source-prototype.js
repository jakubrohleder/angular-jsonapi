(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPISourcePrototype', AngularJsonAPISourcePrototypeWrapper);

  function AngularJsonAPISourcePrototypeWrapper() {
    AngularJsonAPISourcePrototype.prototype.before = beforeSynchro;
    AngularJsonAPISourcePrototype.prototype.after = afterSynchro;
    AngularJsonAPISourcePrototype.prototype.begin = begin;
    AngularJsonAPISourcePrototype.prototype.finish = finish;
    AngularJsonAPISourcePrototype.prototype.synchronization = synchronization;

    return AngularJsonAPISourcePrototype;

    function AngularJsonAPISourcePrototype(name) {
      var _this = this;
      var allHooks = [
        'add',
        'init',
        'get',
        'all',
        'clearCache',
        'remove',
        'unlink',
        'unlinkReflection',
        'link',
        'linkReflection',
        'update',
        'refresh',
        'include'
      ];

      _this.name = name;
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

  }
})();
