(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .directive('errorMessage', errorMessage);

  function errorMessage() {
    return {
      restrict: 'E',
      templateUrl: 'app/components/error-message/error-message.html',
      scope: {
        errors: '=data'
      }
    };
  }

})();
