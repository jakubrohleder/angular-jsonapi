(function() {
  'use strict';

  angular.module('angularJsonapiExample', [
    'ui.router',
    'angular-jsonapi',
    'angular-jsonapi-local',
    'angular-jsonapi-rest',
    'jsonFormatter',
    'ngClipboard',
    'promise-button',
    'RecursionHelper'
  ])
  .config(function(ngClipProvider) {
    ngClipProvider.setPath('bower_components/zeroclipboard/dist/ZeroClipboard.swf');
  })
  .config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('frame', {
        url: '',
        templateUrl: 'app/frame/frame.html',
        controller: 'FrameController',
        abstract: true
      })
      .state('frame.hello', {
        url: '',
        templateUrl: 'app/frame/hello.html'
      })
      .state('frame.request', {
        url: '/{type}',
        template: '<ui-view></ui-view>',
        controller: 'RequestController',
        abstract: true,
        resolve: {
          factory: function($jsonapi, $stateParams) {
            return $jsonapi.getResource($stateParams.type);
          }
        }
      })
      .state('frame.request.all', {
        url: '',
        templateUrl: 'app/request/all.html',
        controller: 'RequestAllController',
        resolve: {
          collection: function(factory, $location, $jsonapi) {
            var params = $jsonapi.sourceRest.decodeParams($location.search());

            return factory.all(params);
          }
        }
      })
      .state('frame.request.get', {
        url: '/{id}',
        templateUrl: 'app/request/get.html',
        controller: 'RequestGetController',
        resolve: {
          object: function(factory, $stateParams) {
            return factory.get($stateParams.id);
          }
        }
      });

    $urlRouterProvider.otherwise('/robots');
  });
})();
