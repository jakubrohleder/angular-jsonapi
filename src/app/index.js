'use strict';

angular.module('angular-jsonapi-example', [
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
