(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .run(logEvents);

  function logEvents($rootScope) {
    var events = [
      'angularJsonAPI:factory:init',
      'angularJsonAPI:factory:clear',
      'angularJsonAPI:object:save',
      'angularJsonAPI:object:refresh',
      'angularJsonAPI:object:remove',
      'angularJsonAPI:object:link',
      'angularJsonAPI:object:unlink'
    ];

    angular.forEach(events, logOnEvent);

    function logOnEvent(eventName) {
      $rootScope.$on(eventName, function(event, status, results) {
        console.debug(eventName, status, results);
      });
    }
  }
})();
