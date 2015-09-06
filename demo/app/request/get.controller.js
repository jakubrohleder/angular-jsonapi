(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .controller('RequestGetCtrl', RequestGetCtrl);

  function RequestGetCtrl(
    $scope, object
  ) {
    $scope.object = object;
  }
})();
