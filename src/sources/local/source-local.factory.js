(function() {
  'use strict';

  angular.module('angular-jsonapi-local')
  .factory('AngularJsonAPISourceLocal', AngularJsonAPISourceLocalWrapper);

  function AngularJsonAPISourceLocalWrapper(
    AngularJsonAPISourcePrototype,
    $window,
    $q
  ) {
    var size = {
      max: 0,
      all: 0,
      limit: 5200000,
      list: {}
    };

    AngularJsonAPISourceLocal.prototype = Object.create(AngularJsonAPISourcePrototype.prototype);
    AngularJsonAPISourceLocal.prototype.constructor = AngularJsonAPISourceLocal;

    return {
      create: AngularJsonAPISourceLocalFactory,
      size: size
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
        var key = prefix + '.' + type;

        size.all -= size.list[key];
        delete size.list[key];
        size.max = objectMaxKey(size.list);
        size.fraction = size.list[size.max] / size.limit * 100;

        $window.localStorage.removeItem(key);
      }

      function updateStorage() {
        var type = _this.synchronizer.resource.schema.type;
        var cache = _this.synchronizer.resource.cache;
        var json = cache.toJson();
        var key = prefix + '.' + type;

        size.list[key] = size.list[key] === undefined ? 0 : size.list[key];
        size.all += json.length - size.list[key];
        size.list[key] = json.length;
        size.max = objectMaxKey(size.list);
        size.fraction = size.list[size.max] / size.limit * 100;

        $window.localStorage.setItem(key, json);
      }

      function objectMaxKey(object) {
        return Object.keys(object).reduce(function(m, k) {
          return object[k] > object[m] ? k : m;
        }, Object.keys(object)[0]);
      }
    }
  }
})();
