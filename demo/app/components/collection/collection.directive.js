(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .directive('collection', collection);

  function collection() {
    return {
      restrict: 'E',
      templateUrl: 'app/components/collection/collection.html',
      scope: {
        collection: '='
      },
      controller: function($scope, $interval) {
        $interval(function() {
          $scope.updateDiff = (Date.now() - $scope.collection.updatedAt) / 1000;
        }, 100);

        $scope.equals = angular.equals;
      }
    };
  }

})();
