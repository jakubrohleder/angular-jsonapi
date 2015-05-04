'use strict';

angular.module('angularJsonapiExample', [
    'ui.router',
    'ui.bootstrap',
    'angularJsonapi',
    'angularJsonapiLocal',
    'angularJsonapiRest',
    'jsonFormatter',
    'ngClipboard',
    'ngMockE2E'
  ])
  .config(function(ngClipProvider) {
    ngClipProvider.setPath('bower_components/zeroclipboard/dist/ZeroClipboard.swf');
  })
  .config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
      });

    $urlRouterProvider.otherwise('/');
  });
