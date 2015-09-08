(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .controller('FrameCtrl', frameCtrl);

  function frameCtrl(
    $jsonapi,
    $scope
  ) {
    $scope.names = $jsonapi.factoriesNames();
  }
})();
