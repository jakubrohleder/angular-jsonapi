(function() {
  'use strict';

  angular.module('angular-jsonapi-local', ['angular-jsonapi'])
  .factory('AngularJsonAPISourceLocal', AngularJsonAPISourceLocalWrapper);

  function AngularJsonAPISourceLocalWrapper(
    AngularJsonAPISourcePrototype,
    $window,
    $q
  ) {

    AngularJsonAPISourceLocal.prototype = Object.create(AngularJsonAPISourcePrototype.prototype);
    AngularJsonAPISourceLocal.prototype.constructor = AngularJsonAPISourceLocal;

    return {
      create: AngularJsonAPISourceLocalFactory
    };

    function AngularJsonAPISourceLocalFactory(name, prefix) {
      return new AngularJsonAPISourceLocal(name, prefix);
    }

    function AngularJsonAPISourceLocal(name, prefix) {
      var _this = this;

      prefix = prefix || 'AngularJsonAPI';

      _this.__updateStorage = updateStorage;

      AngularJsonAPISourcePrototype.apply(_this, arguments);

      _this.synchronization('init', init);

      _this.begin('clearCache', clear);

      _this.finish('init', updateStorage);
      _this.finish('clearCache', updateStorage);
      _this.finish('remove', updateStorage);
      _this.finish('refresh', updateStorage);
      _this.finish('unlink', updateStorage);
      _this.finish('unlinkReflection', updateStorage);
      _this.finish('link', updateStorage);
      _this.finish('linkReflection', updateStorage);
      _this.finish('update', updateStorage);
      _this.finish('add', updateStorage);
      _this.finish('get', updateStorage);
      _this.finish('all', updateStorage);
      _this.finish('include', updateStorage);

      function init() {
        var type = _this.synchronizer.resource.schema.type;
        return $q.resolve($window.localStorage.getItem(prefix + '.' + type));
      }

      function clear() {
        var type = _this.synchronizer.resource.schema.type;
        $window.localStorage.removeItem(prefix + '.' + type);
      }

      function updateStorage() {
        var type = _this.synchronizer.resource.schema.type;
        var cache = _this.synchronizer.resource.cache;
        $window.localStorage.setItem(prefix + '.' + type, cache.toJson());
      }
    }
  }
})();
