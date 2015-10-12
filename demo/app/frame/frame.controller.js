(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .controller('FrameController', frameController);

  function frameController(
    $jsonapi,
    $scope,
    AngularJsonAPISourceLocal
  ) {
    $scope.names = $jsonapi.listResources();

    $scope.localStoreSize = AngularJsonAPISourceLocal.size;
  }
})();
