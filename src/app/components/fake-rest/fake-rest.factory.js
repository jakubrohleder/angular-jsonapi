(function() {
  'use strict';

  angular.module('angularJsonapiExample')
  /* jshint ignore:start */
  .constant('faker', faker)
  .config(function($provide) {
    $provide.decorator('$httpBackend', function($delegate) {
      var proxy = function(method, url, data, callback, headers) {
        var interceptor = function() {
          var _this = this;
          var _arguments = arguments;
          if (/main\//.test(url) || /app\//.test(url)) {
            callback.apply(_this, _arguments);
          } else {
            setTimeout(function() {
              callback.apply(_this, _arguments);
            }, 3000);
          }
        };

        return $delegate.call(this, method, url, data, interceptor, headers);
      };

      for (var key in $delegate) {
        proxy[key] = $delegate[key];
      }

      return proxy;
    });
  })
  /* jshint ignore:end */
  .run(function(
    $log,
    $httpBackend
  ) {

    // function randomNovel(id) {
    //   id = id || uuid4.generate();
    //   return {
    //     type: 'novels',
    //     id: id,
    //     title: faker.company.catchPhrase(),
    //     part: faker.random.number(10),
    //     links: {
    //       self: 'http://example.com/novels/1',
    //       author: {
    //         self: 'http://example.com/novels/1/links/author',
    //         related: 'http://example.com/novels/1/author',
    //         linkage: { type: 'people', id: uuid4.generate() }
    //       },
    //       dieties: {
    //         self: 'http://example.com/novels/1/links/dieties',
    //         related: 'http://example.com/novels/1/dieties',
    //         linkage: [
    //           { type: 'dieties', id: uuid4.generate() },
    //           { type: 'dieties', id: uuid4.generate() }
    //         ]
    //       }
    //     }
    //   };
    // }

    // function randomDiety(id) {
    //   id = id || uuid4.generate();
    //   return {
    //     type: 'dieties',
    //     id: id,
    //     name: faker.company.companyName(),
    //     part: faker.random.number(12),
    //     links: {
    //       self: 'http://example.com/dieties/1',
    //       apearences: {
    //         self: 'http://example.com/dieties/1/links/apearences',
    //         related: 'http://example.com/dieties/1/apearences',
    //         linkage: [{ type: 'novels', id: uuid4.generate() }]
    //       }
    //     }
    //   };
    // }

    // function randomPerson(id) {
    //   id = id || uuid4.generate();
    //   return {
    //     type: 'people',
    //     id: id,
    //     firstName: faker.name.firstName(),
    //     lastName: faker.name.lastName(),
    //     links: {
    //       self: 'http://example.com/people/1',
    //       novels: {
    //         self: 'http://example.com/people/1/links/novels',
    //         related: 'http://example.com/people/1/novels',
    //         linkage: [{ type: 'novels', id: uuid4.generate() }]
    //       }
    //     }
    //   };
    // }

    // function buildResponse(count, random, id) {
    //   var result = {
    //     data: []
    //   };

    //   for (var i = 0; i < count; i++) {
    //     var obj = random(id);
    //     result.data.push(obj);
    //   }

    //   return result;
    // }
    //

    var novelData = {
      type: 'novels',
      id: '975fe66c-43c6-46cb-98fe-1cac46370de2',
      attributes: {
        title: 'An Epicure in the Terrible',
        part: 1
      },
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
      attributes: {
        firstName: 'Howard Phillips',
        lastName: 'Lovecraft'
      },
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
      attributes: {
        firstName: 'Stephan',
        lastName: 'King'
      },
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
      attributes: {
        name: 'Shub-Niggurath',
        power: 10
      },
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
      attributes: {
        name: 'Evil twins Nug and Yeb',
        power: 4
      },
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
      attributes: {
        name: 'Cthulhu',
        power: 12
      },
      links: {
        self: 'http://example.com/dieties/1',
        apearences: {
          self: 'http://example.com/dieties/1/links/apearences',
          related: 'http://example.com/dieties/1/apearences',
          linkage: []
        }
      }
    };

    var people = {};
    people[person1Data.id] = person1Data;
    people[person2Data.id] = person2Data;
    var dieties = {};
    dieties[diety1Data.id] = diety1Data;
    dieties[diety2Data.id] = diety2Data;
    dieties[diety3Data.id] = diety3Data;
    var novels = {};
    novels[novelData.id] = novelData;

    $httpBackend.whenGET('/people').respond(function() {
      var res = [];
      angular.forEach(people, function(person) {
        res.push(person);
      });

      return [200, {data: res}, {}];
    });

    $httpBackend.whenGET(/\/people\/[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/).respond(function(method, url) {
      var id = url.split('/')[2];
      if (people[id] === undefined) {
        return [404, [], {}];
      } else {
        return [200, {data: people[id]}, {}];
      }
    });

    $httpBackend.whenDELETE(/\/people\/[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/).respond(function(method, url) {
      var id = url.split('/')[2];
      delete people[id];

      return [200, {}, {}];
    });

    $httpBackend.whenGET('/novels').respond(function() {
      var res = [];
      angular.forEach(novels, function(novel) {
        res.push(novel);
      });

      return [200, {data: res, included: [dieties[diety1Data.id]]}, {}];
    });

    $httpBackend.whenGET(/\/novels\/[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/).respond(function(method, url) {
      var id = url.split('/')[2];
      if (novels[id] === undefined) {
        return [404, [], {}];
      } else {
        return [200, {data: novels[id]}, {}];
      }
    });

    $httpBackend.whenDELETE(/\/novels\/[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/).respond(function(method, url) {
      var id = url.split('/')[2];
      delete novels[id];

      return [200, {}, {}];
    });

    $httpBackend.whenGET('/dieties').respond(function() {
      var res = [];
      angular.forEach(dieties, function(diety) {
        res.push(diety);
      });

      return [200, {data: res}, {}];
    });

    $httpBackend.whenGET(/\/dieties\/[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/).respond(function(method, url) {
      var id = url.split('/')[2];
      if (dieties[id] === undefined) {
        return [404, [], {}];
      } else {
        return [200, {data: dieties[id]}, {}];
      }
    });

    $httpBackend.whenDELETE(/\/dieties\/[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/).respond(function(method, url) {
      var id = url.split('/')[2];
      delete dieties[id];

      return [200, {}, {}];
    });

    $httpBackend.whenGET(/main\//).passThrough();
    $httpBackend.whenGET(/app\//).passThrough();
  });
})();
