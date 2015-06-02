(function() {
  'use strict';

  angular.module('angularJsonapiExample')
  /* jshint ignore:start */
  .constant('faker', faker)
  .constant('URL', URL)
  .constant('console', console)
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
    $httpBackend,
    URL,
    console
  ) {

    var novelData = {
      type: 'novels',
      id: '975fe66c-43c6-46cb-98fe-1cac46370de2',
      attributes: {
        title: 'An Epicure in the Terrible',
        part: 1
      },
      links: {
        self: 'http://example.com/novels/1'
      },
      relationships: {
        author: {
          links: {
            self: 'http://example.com/novels/1/links/author',
            related: 'http://example.com/novels/1/author'
          },
          data: { type: 'people', id: '873edec0-5266-463f-9fd4-24365637b4f4' }
        },
        dieties: {
          links: {
            self: 'http://example.com/novels/1/links/dieties',
            related: 'http://example.com/novels/1/dieties'
          },
          data: [
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
        self: 'http://example.com/people/1'
      }, relationships: {
        novels: {
          links: {
            self: 'http://example.com/people/1/links/novels',
            related: 'http://example.com/people/1/novels'
          },
          data: [{ type: 'novels', id: '975fe66c-43c6-46cb-98fe-1cac46370de2' }]
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
        self: 'http://example.com/people/1'
      }, relationships: {
        novels: {
          links: {
            self: 'http://example.com/people/1/links/novels',
            related: 'http://example.com/people/1/novels'
          },
          data: []
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
        self: 'http://example.com/dieties/1'
      }, relationships: {
        apearences: {
          links: {
            self: 'http://example.com/dieties/1/links/apearences',
            related: 'http://example.com/dieties/1/apearences'
          },
          data: [{ type: 'novels', id: '975fe66c-43c6-46cb-98fe-1cac46370de2' }]
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
        self: 'http://example.com/dieties/1'
      }, relationships: {
        apearences: {
          links: {
            self: 'http://example.com/dieties/1/links/apearences',
            related: 'http://example.com/dieties/1/apearences'
          },
          data: [{ type: 'novels', id: '975fe66c-43c6-46cb-98fe-1cac46370de2' }]
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
        self: 'http://example.com/dieties/1'
      }, relationships: {
        apearences: {
          links: {
            self: 'http://example.com/dieties/1/links/apearences',
            related: 'http://example.com/dieties/1/apearences'
          },
          data: []
        }
      }
    };

    var datas = {
      people: {},
      dieties: {},
      novels: {}
    };
    datas.people[person1Data.id] = person1Data;
    datas.people[person2Data.id] = person2Data;
    datas.dieties[diety1Data.id] = diety1Data;
    datas.dieties[diety2Data.id] = diety2Data;
    datas.dieties[diety3Data.id] = diety3Data;
    datas.novels[novelData.id] = novelData;

    $httpBackend.whenGET('/people').respond(function() {
      var res = [];
      angular.forEach(datas.people, function(person) {
        res.push(person);
      });

      return [200, {data: res}, {}];
    });

    $httpBackend.whenGET(/\/people\/[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/).respond(function(method, url) {
      console.debug('People get:', url);
      var urlObject = parseUrl(url);
      var id = urlObject.id;
      var data = {};
      if (datas.people[id] === undefined) {
        return [404, [], {}];
      } else {
        data.data = datas.people[id];
        return [200, data, {}];
      }
    });

    $httpBackend.whenDELETE(/\/people\/[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/).respond(function(method, url) {
      console.debug('Delete get:', url);
      var urlObject = parseUrl(url);
      var id = urlObject.id;
      delete datas.people[id];

      return [200, {}, {}];
    });

    $httpBackend.whenGET('/novels').respond(function() {
      var res = [];
      angular.forEach(datas.novels, function(novel) {
        res.push(novel);
      });

      return [200, {data: res, included: [datas.dieties[diety1Data.id]]}, {}];
    });

    $httpBackend.whenGET(/\/novels\/[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/).respond(function(method, url) {
      console.debug('Novel get:', url, parseUrl(url));
      var urlObject = parseUrl(url);
      var id = urlObject.id;
      var data = {};
      if (datas.novels[id] === undefined) {
        return [404, [], {}];
      } else {
        data.data = datas.novels[id];
        if (urlObject.search !== undefined && urlObject.search.include !== undefined) {
          data.included = [];
          angular.forEach(urlObject.search.include, function(elem) {
            if (angular.isArray(datas.novels[id].relationships[elem].data)) {
              angular.forEach(datas.novels[id].relationships[elem].data, function(include) {
                data.included.push(datas[include.type][include.id]);
              });
            } else {
              data.included.push(datas[datas.novels[id].relationships[elem].data.type][datas.novels[id].relationships[elem].data.id]);
            }

          });
        }

        return [200, data, {}];
      }
    });

    $httpBackend.whenDELETE(/\/novels\/[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/).respond(function(method, url) {
      console.debug('Novel delete:', url);
      var urlObject = parseUrl(url);
      var id = urlObject.id;
      delete datas.novels[id];

      return [200, {}, {}];
    });

    $httpBackend.whenGET('/dieties').respond(function() {
      var res = [];
      angular.forEach(datas.dieties, function(diety) {
        res.push(diety);
      });

      return [200, {data: res}, {}];
    });

    $httpBackend.whenGET(/\/dieties\/[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/).respond(function(method, url) {
      console.debug('Dieties get:', url);
      var urlObject = parseUrl(url);
      var id = urlObject.id;
      var data = {};
      if (datas.dieties[id] === undefined) {
        return [404, [], {}];
      } else {
        data.data = datas.dieties[id];
        return [200, data, {}];
      }
    });

    $httpBackend.whenDELETE(/\/dieties\/[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/).respond(function(method, url) {
      console.debug('Dieties delete:', url);
      var urlObject = parseUrl(url);
      var id = urlObject.id;
      delete datas.dieties[id];

      return [200, {}, {}];
    });

    $httpBackend.whenGET(/main\//).passThrough();
    $httpBackend.whenGET(/app\//).passThrough();

    function parseUrl(url) {
      var obj = {};
      var hash;
      var regex = /[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/;

      obj.search = (new URL('http://example.com' + url)).search;
      console.log(obj);
      if (obj.search !== undefined) {
        hash = obj.search.split('&');
        hash[0] = hash[0].substr(1);
        obj.search = {};
        angular.forEach(hash, function(elem) {
          var t = elem.split('=');
          if (t[1] !== undefined) {
            obj.search[t[0]] = t[1].split(',');
          }
        });
      }

      obj.id = regex.exec(url)[0];

      // parser.protocol; // => "http:"
      // parser.hostname; // => "example.com"
      // parser.port;     // => "3000"
      // parser.pathname; // => "/pathname/"
      // parser.search;   // => "?search=test"
      // parser.hash;     // => "#hash"
      // parser.host;     // => "example.com:3000"

      return obj;
    }

  });
})();
