(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .directive('testForm', testForm);

  function testForm() {
    return {
      restrict: 'E',
      templateUrl: 'app/components/test-form/test-form.html',
      scope: {
        object: '='
      },
      controller: function($scope, $interval) {
        angular.forEach($scope.object.form.data, function(val, attribute) {
          $scope.$watch('object.form.data.' + attribute, function(nv, ov) {
            if (nv !== ov) {
              $scope.object.form.validateField(attribute);
            }
          });
        });
        $scope.isArray = angular.isArray;
        $interval(function() {
          $scope.updateDiff = (Date.now() - $scope.object.updatedAt) / 1000;
        }, 100);
      }
    };
  }
})();
