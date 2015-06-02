(function() {
  'use strict';

  angular.module('angularJsonapiLocal', ['angularJsonapi'])
  .factory('AngularJsonAPISynchronizationLocal', AngularJsonAPISynchronizationLocalWrapper);

  function AngularJsonAPISynchronizationLocalWrapper(AngularJsonAPISynchronization, $window) {

    AngularJsonAPISynchronizationLocal.prototype = Object.create(AngularJsonAPISynchronization.prototype);
    AngularJsonAPISynchronizationLocal.prototype.constructor = AngularJsonAPISynchronizationLocal;

    return AngularJsonAPISynchronizationLocal;

    function AngularJsonAPISynchronizationLocal(prefix) {
      var _this = this;

      _this.__updateStorage = updateStorage;

      AngularJsonAPISynchronization.call(_this);

      _this.begin('init', init);
      _this.begin('clear', clear);
      _this.begin('remove', updateStorage);
      _this.begin('removeLink', updateStorage);
      _this.begin('removeLinkReflection', updateStorage);
      _this.begin('addLink', updateStorage);
      _this.begin('addLinkReflection', updateStorage);
      _this.begin('update', updateStorage);
      _this.begin('add', updateStorage);
      _this.finish('get', updateStorage);
      _this.finish('all', updateStorage);

      _this.finish('init', updateStorage);
      _this.finish('clear', updateStorage);
      _this.finish('remove', updateStorage);
      _this.finish('removeLink', updateStorage);
      _this.finish('removeLinkReflection', updateStorage);
      _this.finish('addLink', updateStorage);
      _this.finish('addLinkReflection', updateStorage);
      _this.finish('update', updateStorage);
      _this.finish('add', updateStorage);
      _this.finish('get', updateStorage);
      _this.finish('all', updateStorage);

      function init(collection) {
        var datas = $window.localStorage.getItem(prefix + '.' + collection.Model.prototype.schema.type);
        collection.fromJson(datas);
      }

      function clear(collection) {
        $window.localStorage.removeItem(prefix + '.' + collection.Model.prototype.schema.type);
      }

      function updateStorage(collection) {
        $window.localStorage.setItem(prefix + '.' + collection.Model.prototype.schema.type, collection.toJson());
      }
    }
  }
})();
