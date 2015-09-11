(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .controller('RequestAllCtrl', RequestAllCtrl);

  function RequestAllCtrl(
    $scope, collection
  ) {
    $scope.collection = collection;
  }
})();
