(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .run(logEvents);

  function logEvents($rootScope) {
    var events = [
      'factory:init',
      'factory:clearCache',
      'factory:initialize',
      'object:add',
      'object:update',
      'object:refresh',
      'object:remove',
      'object:link',
      'object:linkReflection',
      'object:unlink',
      'object:include',
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
      $rootScope.$on('angularJsonAPI:' + factory + ':' + eventName, function(event, status, object, response) {
        // console.info(factory, eventName, status, object, response);
      });
    }
  }
})();
