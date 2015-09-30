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
    var uuid4Regex = '[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}';

    $stateProvider
      .state('frame', {
        url: '',
        templateUrl: 'app/frame/frame.html',
        controller: 'FrameCtrl',
        abstract: true
      })
      .state('frame.hello', {
        url: '',
        templateUrl: 'app/frame/hello.html'
      })
      .state('frame.request', {
        url: '/{type}',
        template: '<ui-view></ui-view>',
        controller: 'RequestCtrl',
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
        controller: 'RequestAllCtrl',
        resolve: {
          collection: function(factory) {
            return factory.all();
          }
        }
      })
      .state('frame.request.get', {
        url: '/{id:' + uuid4Regex + '}',
        templateUrl: 'app/request/get.html',
        controller: 'RequestGetCtrl',
        resolve: {
          object: function(factory, $stateParams) {
            return factory.get($stateParams.id);
          }
        }
      });

    $urlRouterProvider.otherwise('/robots');
  });
})();
