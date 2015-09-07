(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .directive('angularJsonapiCollection', collection);

  function collection(RecursionHelper) {
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

        $scope.equals = angular.equals;

        $scope.close = close;

        function close() {
          $scope.$broadcast('close');
        }
      }
    };
  }

})();
