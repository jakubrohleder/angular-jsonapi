(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .directive('sidebar', sidebar);

  function sidebar() {
    return {
      restrict: 'E',
      templateUrl: 'app/sidebar/sidebar.html',
      controller: sidebarController,
      replace: true
    };

    function sidebarController($scope, $jsonapi) {
      $scope.names = $jsonapi.listResources();
    }
  }

})();
