'use strict';

angular.module('angularJsonapiExample', [
    'ui.router',
    'ui.bootstrap',
    'angular-jsonapi',
    'angular-jsonapi-local',
    'angular-jsonapi-rest',
    'jsonFormatter',
    'ngClipboard',
    'ngMockE2E'
  ])
  .config(function(ngClipProvider) {
    ngClipProvider.setPath('bower_components/zeroclipboard/dist/ZeroClipboard.swf');
  })
  .config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('novels', {
        url: '/novels',
        views: {
          'stats@': {
            templateUrl: 'app/stats/stats.html',
            controller: 'StatsCtrl'
          },
          'site@': {
            templateUrl: 'app/site/novels.html',
            controller: 'NovelsCtrl',
            resolve: {
              novels: function(Novels) {
                return Novels.all();
              }
            }
          }
        }
      })
      .state('novels.novel', {
        url: '/{id:[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}}',
        views: {
          'site@': {
            templateUrl: 'app/site/novel.html',
            controller: 'NovelCtrl',
            resolve: {
              novel: function($stateParams, Novels) {
                return Novels.get($stateParams.id);
              }
            }
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
            controller: 'DietiesCtrl',
            resolve: {
              dieties: function(Dieties) {
                return Dieties.all();
              }
            }
          }
        }
      })
      .state('dieties.diety', {
        url: '/{id:[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}}',
        views: {
          'site@': {
            templateUrl: 'app/site/diety.html',
            controller: 'DietyCtrl',
            resolve: {
              diety: function($stateParams, Dieties) {
                return Dieties.get($stateParams.id);
              }
            }
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
            controller: 'PeopleCtrl',
            resolve: {
              people: function(People) {
                return People.all();
              }
            }
          }
        }
      })
      .state('people.person', {
        url: '/{id:[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}}',
        views: {
          'site@': {
            templateUrl: 'app/site/person.html',
            controller: 'PersonCtrl',
            resolve: {
              person: function($stateParams, People) {
                return People.get($stateParams.id);
              }
            }
          }
        }
      })

      ;

    $urlRouterProvider.otherwise('/novels');
  });
