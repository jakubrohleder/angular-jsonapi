(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPICollectionCache', AngularJsonAPICollectionCacheWrapper);

  function AngularJsonAPICollectionCacheWrapper(

  ) {

    AngularJsonAPICollectionCache.prototype.fromJson = fromJson;
    AngularJsonAPICollectionCache.prototype.toJson = toJson;

    return AngularJsonAPICollectionCache;

    function AngularJsonAPICollectionCache() {
      // body...
    }

    function fromJson() {
      // body...
    }

    function toJson() {
      // body...
    }
  }
})();
