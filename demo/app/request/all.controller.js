(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .controller('RequestAllController', RequestAllController);

  function RequestAllController(
    $scope, collection
  ) {
    $scope.collection = collection;
  }
})();
