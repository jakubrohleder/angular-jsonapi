(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .directive('angularJsonapiObject', object);

  function object(RecursionHelper) {
    return {
      restrict: 'E',
      templateUrl: 'app/components/object/object.html',
      scope: {
        object: '=data',
        unlink: '&',
        nested: '='
      },
      require: '^angularJsonapiObject',
      compile: RecursionHelper.compile,
      controller: controller
    };

    function controller($scope, $interval) {
      var interval;

      $scope.showMore = false;
      $scope.isArray = angular.isArray;

      $scope.$watch('showMore', toggleTimmer);

      $scope.$on('close', function() {
        $scope.showMore = false;
      });

      $scope.equals = angular.equals;

      function toggleTimmer(value) {
        if (value === true) {
          $scope.updateDiff = (Date.now() - $scope.object.updatedAt) / 1000;
          interval = $interval(function() {
            $scope.updateDiff = (Date.now() - $scope.object.updatedAt) / 1000;
          }, 100);
        } else if (value === false) {
          $interval.cancel(interval);
        }
      }
    }
  }

})();
