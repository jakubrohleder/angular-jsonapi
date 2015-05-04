(function() {
  'use strict';

  angular.module('angularJsonapiExample')
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

  .run(function(
    $log,
    $httpBackend,
    $timeout,
    uuid4,
    faker
  ) {

    function randomNovel(id) {
      id = id || uuid4.generate();
      return {
        type: 'novels',
        id: id,
        title: faker.company.catchPhrase(),
        part: faker.random.number(10),
        links: {
          self: 'http://example.com/novels/1',
          author: {
            self: 'http://example.com/novels/1/links/author',
            related: 'http://example.com/novels/1/author',
            linkage: { type: 'people', id: uuid4.generate() }
          },
          dieties: {
            self: 'http://example.com/novels/1/links/dieties',
            related: 'http://example.com/novels/1/dieties',
            linkage: [
              { type: 'dieties', id: uuid4.generate() },
              { type: 'dieties', id: uuid4.generate() }
            ]
          }
        }
      };
    }

    function randomDiety(id) {
      id = id || uuid4.generate();
      return {
        type: 'dieties',
        id: id,
        name: faker.company.companyName(),
        part: faker.random.number(12),
        links: {
          self: 'http://example.com/dieties/1',
          apearences: {
            self: 'http://example.com/dieties/1/links/apearences',
            related: 'http://example.com/dieties/1/apearences',
            linkage: [{ type: 'novels', id: uuid4.generate() }]
          }
        }
      };
    }

    function randomPerson(id) {
      id = id || uuid4.generate();
      return {
        type: 'people',
        id: id,
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        links: {
          self: 'http://example.com/people/1',
          novels: {
            self: 'http://example.com/people/1/links/novels',
            related: 'http://example.com/people/1/novels',
            linkage: [{ type: 'novels', id: uuid4.generate() }]
          }
        }
      };
    }

    function buildResponse(count, random, id) {
      var result = {
        data: []
      };

      for (var i = 0; i < count; i++) {
        var obj = random(id);
        result.data.push(obj);
      }

      return result;
    }

    $httpBackend.whenGET('/people').respond(function() {
      return [200, buildResponse(3, randomPerson), {}];
    });

    $httpBackend.whenGET(/\/people\/[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/).respond(function(method, url) {
      var id = url.split('/')[2];
      return [200, randomPerson(id), {}];
    });

    $httpBackend.whenDELETE(/\/people\/[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/).respond(function() {
      return [200, {}, {}];
    });

    $httpBackend.whenGET('/novels').respond(function() {
      return [200, buildResponse(3, randomNovel), {}];
    });

    $httpBackend.whenGET(/\/novels\/[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/).respond(function(method, url) {
      var id = url.split('/')[2];
      return [200, randomNovel(id), {}];
    });

    $httpBackend.whenDELETE(/\/novels\/[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/).respond(function() {
      return [200, {}, {}];
    });

    $httpBackend.whenGET('/dieties').respond(function() {
      return [200, buildResponse(3, randomDiety), {}];
    });

    $httpBackend.whenGET(/\/dieties\/[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/).respond(function(method, url) {
      var id = url.split('/')[2];
      return [200, randomDiety(id), {}];
    });

    $httpBackend.whenDELETE(/\/dieties\/[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/).respond(function() {
      return [200, {}, {}];
    });

    $httpBackend.whenGET(/main\//).passThrough();
    $httpBackend.whenGET(/app\//).passThrough();
  });
})();
