(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .run(logEvents);

  function logEvents($rootScope) {
    $rootScope.$on('angularJsonAPI:collection:fetch', function(event, status, results) {
      console.log('angularJsonAPI:collection:fetch', status, results);
    });
  }
})();
