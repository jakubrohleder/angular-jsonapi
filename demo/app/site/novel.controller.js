(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .controller('NovelCtrl', NovelCtrl);

  function NovelCtrl(
    $scope,
    novel
  ) {
    $scope.novel = novel;
  }
})();
