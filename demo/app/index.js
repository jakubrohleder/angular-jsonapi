'use strict';

angular.module('angularJsonapiExample', [
    'ui.router',
    'angular-jsonapi',
    'angular-jsonapi-local',
    'angular-jsonapi-rest',
    'jsonFormatter',
    'ngClipboard',
    'promise-button'
  ])
  .config(function(ngClipProvider) {
    ngClipProvider.setPath('bower_components/zeroclipboard/dist/ZeroClipboard.swf');
  })
  .config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('test', {
        url: '/',
        templateUrl: 'app/test/test.html',
        controller: 'TestCtrl'
      })
      .state('novels', {
        url: '/novels',
        views: {
          'stats@': {
            templateUrl: 'app/stats/stats.html',
            controller: 'StatsCtrl'
          },
          'site@': {
            templateUrl: 'app/site/novels.html',
            controller: 'NovelsCtrl'
          }
        }
      })
      .state('novels.novel', {
        url: '/{id:[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}}',
        views: {
          'site@': {
            templateUrl: 'app/site/novel.html',
            controller: 'NovelCtrl'
          }
        }
      })
      .state('dieties', {
        url: '/dieties',
        views: {
          'stats@': {
            templateUrl: 'app/stats/stats.html',
            controller: 'StatsCtrl'
          },
          'site@': {
            templateUrl: 'app/site/dieties.html',
            controller: 'DietiesCtrl'
          }
        }
      })
      .state('dieties.diety', {
        url: '/{id:[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}}',
        views: {
          'site@': {
            templateUrl: 'app/site/diety.html',
            controller: 'DietyCtrl'
          }
        }
      })
      .state('people', {
        url: '/people',
        views: {
          'stats@': {
            templateUrl: 'app/stats/stats.html',
            controller: 'StatsCtrl'
          },
          'site@': {
            templateUrl: 'app/site/people.html',
            controller: 'PeopleCtrl'
          }
        }
      })
      .state('people.person', {
        url: '/{id:[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}}',
        views: {
          'site@': {
            templateUrl: 'app/site/person.html',
            controller: 'PersonCtrl'
          }
        }
      })

      ;

    $urlRouterProvider.otherwise('');
  });
