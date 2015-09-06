(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .controller('RequestAllCtrl', RequestAllCtrl);

  function RequestAllCtrl(
    $scope, collection
  ) {
    console.log(collection);
    $scope.collection = collection;
  }
})();
