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
      controller: function($scope) {
        $scope.isArray = angular.isArray;
        angular.forEach($scope.object.form.data, function(val, attribute) {
          $scope.$watch(angular.identity(attribute), function() {
            $scope.object.form.validateField(attribute);
          });
        });
      }
    };
  }
})();
