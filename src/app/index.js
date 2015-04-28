'use strict';

angular.module('angularJsonapiExample', [
    'ui.router',
    'ui.bootstrap',
    'angularJsonapi',
    'jsonFormatter'
  ])
  .config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
      });

    $urlRouterProvider.otherwise('/');
  });
