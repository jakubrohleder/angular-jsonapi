(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .controller('NovelsCtrl', NovelsCtrl);

  function NovelsCtrl(
    $scope,
    novels
  ) {
    $scope.novels = novels;
  }
})();
