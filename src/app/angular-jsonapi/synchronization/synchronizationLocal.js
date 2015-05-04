(function() {
  'use strict';

  angular.module('angularJsonapiLocal', ['angularJsonapi'])
  .factory('AngularJsonAPISynchronizationLocal', AngularJsonAPISynchronizationLocalWrapper);

  function AngularJsonAPISynchronizationLocalWrapper(AngularJsonAPISynchronization, $window) {

    AngularJsonAPISynchronizationLocal.prototype = Object.create(AngularJsonAPISynchronization.prototype);
    AngularJsonAPISynchronizationLocal.prototype.constructor = AngularJsonAPISynchronizationLocal;
    AngularJsonAPISynchronizationLocal.prototype.__updateStorage = __updateStorage;

    return AngularJsonAPISynchronizationLocal;

    function AngularJsonAPISynchronizationLocal(prefix) {
      var _this = this;

      AngularJsonAPISynchronization.call(_this);
      _this.options = {
        storagePrefix: prefix || ''
      };

      _this.before('init', init);
      _this.before('clear', clear);
      _this.before('remove', _this.__updateStorage);
      _this.before('removeLink', _this.__updateStorage);
      _this.before('removeLinkReflection', _this.__updateStorage);
      _this.before('addLink', _this.__updateStorage);
      _this.before('addLinkReflection', _this.__updateStorage);
      _this.before('update', _this.__updateStorage);
      _this.before('add', _this.__updateStorage);

      _this.after('init', init);
      _this.after('clear', clear);
      _this.after('remove', _this.__updateStorage);
      _this.after('removeLink', _this.__updateStorage);
      _this.after('removeLinkReflection', _this.__updateStorage);
      _this.after('addLink', _this.__updateStorage);
      _this.after('addLinkReflection', _this.__updateStorage);
      _this.after('update', _this.__updateStorage);
      _this.after('add', _this.__updateStorage);

    }

    function __get(prefix, collection) {
      return $window.localStorage.getItem(prefix + '.' + collection.Model.prototype.schema.type);
    }

    function __set(prefix, collection) {
      $window.localStorage.setItem(prefix + '.' + collection.Model.prototype.schema.type, collection.toJson());
    }

    function __remove(prefix, collection) {
      $window.localStorage.removeItem(prefix + '.' + collection.Model.prototype.schema.type);
    }

    function init(collection) {
      var _this = this;

      var datas = __get(_this.options.storagePrefix, collection);

      collection.fromJson(datas);
    }

    function clear(collection) {
      var _this = this;

      __remove(_this.options.storagePrefix, collection);
    }

    function __updateStorage(collection) {
      var _this = this;

      __set(_this.options.storagePrefix, collection);
    }

  }
})();
