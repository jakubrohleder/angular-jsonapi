(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .controller('StatsCtrl', statsCtrl);

  function statsCtrl(
    $scope,
    Novels,
    Dieties,
    People,
    $rootScope
  ) {

    $scope.novels = Novels;
    $scope.people = People;
    $scope.dieties = Dieties;

    $scope.newNovel = $scope.novels.dummy;
    $scope.newPerson = $scope.people.dummy;
    $scope.newDiety = $scope.dieties.dummy;

    $rootScope.clear = function() {
      Novels.clear();
      People.clear();
      Dieties.clear();

    };

  }
})();
