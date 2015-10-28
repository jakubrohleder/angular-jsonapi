(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .run(logEvents)
    .run(marioFavicon);

  function logEvents(
    $rootScope,
    $jsonapi,
    $log
  ) {
    var events = [
      'resource:init',
      'resource:clearCache',
      'resource:initialize',
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

    var resources = $jsonapi.listResources();
    var watchers = [];

    angular.forEach(events, function(eventName) {
      angular.forEach(resources, function(resourceName) {
        logOnEvent(eventName, resourceName);
      });
    });

    function logOnEvent(eventName, resource) {
      var watcher = $rootScope.$on('angularJsonAPI:' + resource + ':' + eventName, function(event, status, object, response) {
        $log.info(resource, eventName, status, object, response);
      });

      watchers.push(watcher);
    }

    $rootScope.$on('$destroy', clearWatchers);

    function clearWatchers() {
      angular.forEach(watchers, function(watcher) {
        watcher();
      });
    }
  }

  function marioFavicon(Favico, $interval) {
    var favicon = new Favico({
      animation:'slide',
      position: 'up'
    });
    var up = new Image();
    up.src = 'assets/images/mario-up.gif';

    var down = new Image();
    down.src = 'assets/images/mario-down.gif';

    var isDown = true;

    $interval(changeIcon, 10);

    function changeIcon() {
      isDown = !isDown;
      if (isDown) {
        favicon.image(down);
      } else {
        favicon.image(up);
      }
    }
  }
})();
