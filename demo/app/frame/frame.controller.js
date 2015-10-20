(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .controller('FrameController', frameController);

  function frameController(
    $jsonapi,
    $scope
  ) {
    $scope.names = $jsonapi.listResources();

    $scope.localStoreSize = $jsonapi.sourceLocal.size;
  }
})();
