(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .controller('TestCtrl', testCtrl);

  function testCtrl(
    $scope,
    $jsonapi,
    $timeout,
    $q
  ) {
    $scope.action = action;

    function action() {
      console.log('I\'m thinking...');
      var deffered = $q.defer();

      $timeout(function() {
        if (Math.random() < 0.5) {
          deffered.resolve({someData: 'ok'});
        } else {
          deffered.reject('couse fuck you');
        }
      }, 1500);

      deffered.promise.then(console.log.bind(console, 'Resolved'), console.log.bind(console, 'Rejected'));
      return deffered.promise;
    }
  }
})();
