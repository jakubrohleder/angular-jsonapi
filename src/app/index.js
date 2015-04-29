'use strict';

angular.module('angularJsonapiExample', [
    'ui.router',
    'ui.bootstrap',
    'angularJsonapi',
    'jsonFormatter',
    'ngClipboard'
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
