(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .controller('PersonCtrl', PersonCtrl);

  function PersonCtrl(
    $scope,
    person
  ) {
    $scope.person = person;
  }
})();
