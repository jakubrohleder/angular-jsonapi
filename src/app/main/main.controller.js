(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .controller('MainCtrl', mainCtrl);

  function mainCtrl($scope, AngularJsonAPICollection) {
    var novelsSchema = {
      type: 'novels',
      id: 'uuid4',
      title: ['required', 'string'],
      part: 'integer',
      links: {
        author: 'hasOne',
        dieties: {
          type: 'hasMany',
          reflection: 'apearences'
        }
      }
    };
    var peopleSchema = {
      type: 'people',
      id: 'uuid4',
      firstName: ['required', 'string'],
      lastName: ['required', 'string'],
      links: {
        novels: {
          type: 'hasMany',
          reflection: 'author'
        }
      }
    };
    var dietiesSchema = {
      type: 'dieties',
      id: 'uuid4',
      name: ['required', 'string'],
      power: ['required', 'integer'],
      links: {
        apearences: 'hasMany'
      }
    };

    var novelData = {
      type: 'novels',
      id: '975fe66c-43c6-46cb-98fe-1cac46370de2',
      title: 'An Epicure in the Terrible',
      part: 1,
      links: {
        self: 'http://example.com/novels/1',
        author: {
          self: 'http://example.com/novels/1/links/author',
          related: 'http://example.com/novels/1/author',
          linkage: { type: 'people', id: '873edec0-5266-463f-9fd4-24365637b4f4' }
        },
        dieties: {
          self: 'http://example.com/novels/1/links/dieties',
          related: 'http://example.com/novels/1/dieties',
          linkage: [
            { type: 'dieties', id: '0214cffb-3269-47df-a910-13088d3344cb' },
            { type: 'dieties', id: '1d75c7bc-4c4f-4923-98d4-a53caa137c09' }
          ]
        }
      }
    };

    var personData = {
      type: 'people',
      id: '873edec0-5266-463f-9fd4-24365637b4f4',
      firstName: 'Howard Phillips',
      lastName: 'Lovecraft',
      links: {
        self: 'http://example.com/people/1',
        novels: {
          self: 'http://example.com/people/1/links/novels',
          related: 'http://example.com/people/1/novels',
          linkage: [{ type: 'novels', id: '975fe66c-43c6-46cb-98fe-1cac46370de2' }]
        }
      }
    };

    var diety1Data = {
      type: 'dieties',
      id: '0214cffb-3269-47df-a910-13088d3344cb',
      name: 'Shub-Niggurath',
      power: 10,
      links: {
        self: 'http://example.com/dieties/1',
        apearences: {
          self: 'http://example.com/dieties/1/links/apearences',
          related: 'http://example.com/dieties/1/apearences',
          linkage: [{ type: 'novels', id: '975fe66c-43c6-46cb-98fe-1cac46370de2' }]
        }
      }
    };

    var diety2Data = {
      type: 'dieties',
      id: '1d75c7bc-4c4f-4923-98d4-a53caa137c09',
      name: 'Evil twins Nug and Yeb',
      power: 4,
      links: {
        self: 'http://example.com/dieties/1',
        apearences: {
          self: 'http://example.com/dieties/1/links/apearences',
          related: 'http://example.com/dieties/1/apearences',
          linkage: [{ type: 'novels', id: '975fe66c-43c6-46cb-98fe-1cac46370de2' }]
        }
      }
    };

    var diety3Data = {
      type: 'dieties',
      id: '0b8aff27-f8cc-4393-8fbf-34e97bb8f7cd',
      name: 'Cthulhu',
      power: 12,
      links: {
        self: 'http://example.com/dieties/1',
        apearences: {
          self: 'http://example.com/dieties/1/links/apearences',
          related: 'http://example.com/dieties/1/apearences',
          linkage: []
        }
      }
    };

    $scope.novels = new AngularJsonAPICollection(novelsSchema, {});
    $scope.people = new AngularJsonAPICollection(peopleSchema, {});
    $scope.dieties = new AngularJsonAPICollection(dietiesSchema, {});

    $scope.novels.__add(novelData);
    $scope.people.__add(personData);
    $scope.dieties.__add(diety1Data);
    $scope.dieties.__add(diety2Data);
    $scope.dieties.__add(diety3Data);

    $scope.newNovel = $scope.novels.dummy;
    $scope.newPerson = $scope.people.dummy;
    $scope.newDiety = $scope.dieties.dummy;

  }
})();
