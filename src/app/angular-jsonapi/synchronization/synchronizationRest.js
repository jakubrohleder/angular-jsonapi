(function() {
  'use strict';

  angular.module('angularJsonapiRest', ['angularJsonapi'])
  .factory('AngularJsonAPISynchronizationRest', AngularJsonAPISynchronizationRestWrapper);

  function AngularJsonAPISynchronizationRestWrapper(AngularJsonAPISynchronization, $http) {

    AngularJsonAPISynchronizationRest.prototype = Object.create(AngularJsonAPISynchronization.prototype);
    AngularJsonAPISynchronizationRest.prototype.constructor = AngularJsonAPISynchronizationRest;

    return AngularJsonAPISynchronizationRest;

    function AngularJsonAPISynchronizationRest(prefix) {
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
