(function() {
  'use strict';

  angular.module('angular-jsonapi-local', ['angular-jsonapi'])
  .factory('AngularJsonAPISynchronizationLocal', AngularJsonAPISynchronizationLocalWrapper);

  function AngularJsonAPISynchronizationLocalWrapper(
    AngularJsonAPISynchronizationPrototype,
    $window,
    $q
  ) {

    AngularJsonAPISynchronizationLocal.prototype = Object.create(AngularJsonAPISynchronizationPrototype.prototype);
    AngularJsonAPISynchronizationLocal.prototype.constructor = AngularJsonAPISynchronizationLocal;

    return {
      create: AngularJsonAPISynchronizationLocalFactory
    };

    function AngularJsonAPISynchronizationLocalFactory(name, prefix) {
      return new AngularJsonAPISynchronizationLocal(name, prefix);
    }

    function AngularJsonAPISynchronizationLocal(name, prefix) {
      var _this = this;

      prefix = prefix || 'AngularJsonAPI';

      _this.__updateStorage = updateStorage;

      AngularJsonAPISynchronizationPrototype.apply(_this, arguments);

      _this.synchronization('init', init);

      _this.begin('clearCache', clear);
      _this.begin('remove', updateStorage);
      _this.begin('refresh', updateStorage);
      _this.begin('unlink', updateStorage);
      _this.begin('unlinkReflection', updateStorage);
      _this.begin('link', updateStorage);
      _this.begin('linkReflection', updateStorage);
      _this.begin('update', updateStorage);
      _this.begin('add', updateStorage);
      _this.begin('get', updateStorage);
      _this.begin('all', updateStorage);
      _this.begin('include', updateStorage);

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
        var type = _this.synchronizer.factory.schema.type;
        return $q.resolve($window.localStorage.getItem(prefix + '.' + type));
      }

      function clear() {
        var type = _this.synchronizer.factory.schema.type;
        $window.localStorage.removeItem(prefix + '.' + type);
      }

      function updateStorage() {
        var type = _this.synchronizer.factory.schema.type;
        var cache = _this.synchronizer.factory.cache;
        $window.localStorage.setItem(prefix + '.' + type, cache.toJson());
      }
    }
  }
})();
