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
      .state('bm', {
        url: '/',
        abstract: true,
        templateUrl: 'app/frame/frame.html',
        controller: 'FrameCtrl'
      })
      .state('bm.novels', {
        url: 'novels',
        views: {
          stats: {
            templateUrl: 'app/stats/stats.html',
            controller: 'StatsCtrl'
          },
          site: {
            templateUrl: 'app/site/site.html',
            controller: 'SiteCtrl'
          }
        }
      });

    $urlRouterProvider.otherwise('/novels');
  });
