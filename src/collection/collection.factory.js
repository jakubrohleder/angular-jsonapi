(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPICollection', AngularJsonAPICollectionWrapper);

  function AngularJsonAPICollectionWrapper(

  ) {

    return AngularJsonAPICollection;

    function AngularJsonAPICollection() {

    }
  }
})();
