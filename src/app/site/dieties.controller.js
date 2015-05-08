(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .controller('DietiesCtrl', DietiesCtrl);

  function DietiesCtrl(
    $scope,
    dieties
  ) {
    $scope.dieties = dieties;
  }
})();
