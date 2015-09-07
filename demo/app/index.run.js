(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .run(logEvents);

  function logEvents($rootScope) {
    var events = [
      'factory:init',
      'factory:clear',
      'object:save',
      'object:refresh',
      'object:remove',
      'object:link',
      'object:linkReflection',
      'object:unlink',
      'object:unlinkReflection',
      'collection:fetch'
    ];

    var factories = [
      'jobs',
      'laserGuns',
      'locations',
      'planets',
      'powerArmors',
      'robotModels',
      'robots',
      'spaceshipModels',
      'spaceships'
    ];
    angular.forEach(events, function(eventName) {
      angular.forEach(factories, function(factoryName) {
        logOnEvent(eventName, factoryName);
      });
    });

    function logOnEvent(eventName, factory) {
      $rootScope.$on('angularJsonAPI:' + factory + ':' + eventName, function(event, status, results) {
        console.info(factory, eventName, status, results);
      });
    }
  }
})();
