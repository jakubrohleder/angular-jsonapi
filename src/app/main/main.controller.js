'use strict';

angular.module('angularJsonapi')
  .controller('MainCtrl', function ($scope, $$AngularJsonAPIAbstractDataFactory) {
    var schema = {
      'type': 'novels',
      'id': 'uuid4',
      'title': 'string',
      'links': {
        'author': 'hasOne',
        'dieties': 'hasMany'
      }
    };
    var linkGetters = {
      'author': function(id){return {id: id, name: 'Howard Phillips Lovecraft'};},
      'dieties': function(ids){return [{id: ids[0], name: 'Shub-Niggurath'}, {id: ids[1], name: 'Evil twins Nug and Yeb'}];}
    };
    var data = {
      'type': 'novels',
      'title': 'An Epicure in the Terrible',
      'links': {
        'self': 'http://example.com/novels/1',
        'author': {
          'self': 'http://example.com/novels/1/links/author',
          'related': 'http://example.com/novels/1/author',
          'linkage': { 'type': 'people', 'id': '873edec0-5266-463f-9fd4-24365637b4f4' }
        },
        'dieties': {
          'self': 'http://example.com/novels/1/links/dieties',
          'related': 'http://example.com/novels/1/dieties',
          'linkage': [
            { 'type': 'dieties', 'id': '0214cffb-3269-47df-a910-13088d3344cb' },
            { 'type': 'dieties', 'id': '1d75c7bc-4c4f-4923-98d4-a53caa137c09' }
          ]
        }
      }
    };
    var Novels = $$AngularJsonAPIAbstractDataFactory.model(schema, linkGetters);
    $scope.novel = new Novels(data);
    $scope.author = $scope.novel.links.author();
    $scope.dieties = $scope.novel.links.dieties();
  });
