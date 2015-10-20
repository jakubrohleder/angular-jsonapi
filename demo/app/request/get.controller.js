(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .controller('RequestGetController', RequestGetController);

  function RequestGetController(
    $scope, object
  ) {
    $scope.object = object;
  }
})();
