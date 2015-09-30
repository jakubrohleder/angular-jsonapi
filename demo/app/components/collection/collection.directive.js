(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .directive('angularJsonapiCollection', collection);

  function collection(RecursionHelper, $jsonapi) {
    return {
      restrict: 'E',
      templateUrl: 'app/components/collection/collection.html',
      scope: {
        collection: '=data'
      },
      compile: RecursionHelper.compile,
      controller: function($scope, $interval) {
        $interval(function() {
          $scope.updateDiff = (Date.now() - $scope.collection.updatedAt) / 1000;
        }, 100);

        $scope.newObjects = [];

        $scope.close = close;
        $scope.clear = clear;
        $scope.add = add;

        function close() {
          $scope.$broadcast('close');
        }

        function clear() {
          $jsonapi.clearCache();
        }

        function add() {
          $scope.newObjects.push($scope.collection.factory.initialize());
        }
      }
    };
  }

})();
