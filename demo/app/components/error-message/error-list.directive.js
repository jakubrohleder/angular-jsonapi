(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .directive('errorList', errorList);

  function errorList() {
    return {
      restrict: 'E',
      templateUrl: 'app/components/error-message/error-list.html',
      scope: {
        errors: '=data'
      },
      controller: controller
    };

    function controller($scope) {
      $scope.isObject = angular.isObject;
      $scope.isString = angular.isString;
    }
  }

})();
