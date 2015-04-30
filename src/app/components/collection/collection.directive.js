(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .directive('collection', collection);

  function collection() {
    return {
      restrict: 'E',
      templateUrl: 'app/components/collection/collection.html',
      scope: {
        collection: '='
      },
      controller: function() {

      }
    };
  }

})();
