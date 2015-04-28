(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .directive('testFormNew', testFormNew);

  function testFormNew() {
    return {
      restrict: 'E',
      templateUrl: 'app/components/test-form/test-form-new.html',
      scope: {
        object: '='
      },
      controller: function($scope) {
        angular.forEach($scope.object.form.data, function(val, attribute) {
          console.log('object.form.data.' + attribute);
          $scope.$watch('object.form.data.' + attribute, function(nv) {
            console.log(nv);
            $scope.object.form.validateField(attribute);
          });
        });
      }
    };
  }

})();
