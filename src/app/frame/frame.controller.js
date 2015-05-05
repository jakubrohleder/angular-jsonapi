(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .controller('FrameCtrl', frameCtrl);

  function frameCtrl(
       $scope,
    $timeout,
    $http,
    AngularJsonAPICollection,
    AngularJsonAPISynchronization,
    AngularJsonAPISynchronizationRest,
    AngularJsonAPISynchronizationLocal
  ) {

    var novelsSchema = {
      type: 'novels',
      id: 'uuid4',
      title: ['required', 'string', {minlength: 3}, {maxlength: 50}],
      part: ['integer', {maxvalue: 10, minvalue: 1}],
      links: {
        author: {
          type: 'hasOne',
          model: 'people'
        },
        dieties: {
          type: 'hasMany',
          reflection: 'apearences'
        }
      },
      functions: {
        toString: function() {
          if (!this.data.title) {
            return this.data.id;
          }

          return this.data.title;
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
      },
      functions: {
        toString: function() {
          if (!this.data.firstName && !this.data.lastName) {
            return this.data.id;
          }

          return this.data.firstName + ' ' + this.data.lastName;
        }
      }
    };
    var dietiesSchema = {
      type: 'dieties',
      id: 'uuid4',
      name: ['required', 'string'],
      power: ['required', 'integer'],
      links: {
        apearences: {
          type: 'hasMany',
          polymorphic: true
        }
      },
      functions: {
        toString: function() {
          if (!this.data.name) {
            return this.data.id;
          }

          return this.data.name;
        }
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

    var person1Data = {
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

    var person2Data = {
      type: 'people',
      id: '322a6ce3-0993-42cd-9327-0af7e29244b5',
      firstName: 'Stephan',
      lastName: 'King',
      links: {
        self: 'http://example.com/people/1',
        novels: {
          self: 'http://example.com/people/1/links/novels',
          related: 'http://example.com/people/1/novels',
          linkage: []
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

    var localeSynchro = new AngularJsonAPISynchronizationLocal('AngularJsonAPI');
    var novelsSynchro = new AngularJsonAPISynchronizationRest('/novels');
    var peopleSynchro = new AngularJsonAPISynchronizationRest('/people');
    var dietiesSynchro = new AngularJsonAPISynchronizationRest('/dieties');

    novelsSynchro.extend(localeSynchro);
    peopleSynchro.extend(localeSynchro);
    dietiesSynchro.extend(localeSynchro);

    $scope.novels = new AngularJsonAPICollection(novelsSchema, novelsSynchro);
    $scope.people = new AngularJsonAPICollection(peopleSchema, peopleSynchro);
    $scope.dieties = new AngularJsonAPICollection(dietiesSchema, dietiesSynchro);

    $scope.newNovel = $scope.novels.dummy;
    $scope.newPerson = $scope.people.dummy;
    $scope.newDiety = $scope.dieties.dummy;

    $scope.reset = function() {
      $scope.novels.clear();
      $scope.people.clear();
      $scope.dieties.clear();

      $timeout(function() {
        $scope.novels.addOrUpdate(novelData);
        $scope.people.addOrUpdate(person2Data);
        $scope.people.addOrUpdate(person1Data);
        $scope.dieties.addOrUpdate(diety1Data);
        $scope.dieties.addOrUpdate(diety2Data);
        $scope.dieties.addOrUpdate(diety3Data);

        localeSynchro.__updateStorage($scope.novels);
        localeSynchro.__updateStorage($scope.people);
        localeSynchro.__updateStorage($scope.dieties);
      }, 500);

    };

  }
})();
