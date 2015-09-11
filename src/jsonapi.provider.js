(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .provider('$jsonapi', jsonapiProvider);

  function jsonapiProvider() {
    var memory = {};
    var names = [];
    this.$get = jsonapiFactory;

    function jsonapiFactory($log, AngularJsonAPIFactory) {
      return {
        form: form,
        get: get,
        remove: remove,
        all: all,
        addFactory: addFactory,
        getFactory: getFactory,
        clearCache: clearCache,
        proccesResults: proccesResults,

        allFactories: allFactories,
        factoriesNames: factoriesNames
      };

      function allFactories() {
        return memory;
      }

      function factoriesNames() {
        return names;
      }

      function addFactory(schema, synchronization) {
        var factory = new AngularJsonAPIFactory(schema, synchronization);

        memory[schema.type] = factory;
        names.push(schema.type);
      }

      function getFactory(type) {
        return memory[type];
      }

      function form(type) {
        if (memory[type] === undefined) {
          $log.error('Can\t add not existing object type: ' + type + '. Use initialize(Model, datas).');
        }

        return memory[type].saved.form;
      }

      function get(type, id) {
        if (memory[type] === undefined) {
          $log.error('Can\t get not existing object type: ' + type + '. Use initialize(Model, datas).');
        }

        return memory[type].get(id);
      }

      function remove(type, id) {
        if (memory[type] === undefined) {
          $log.error('Can\t remove not existing object type: ' + type + '. Use initialize(Model, datas).');
        }

        return memory[type].remove(id);
      }

      function all(type) {
        if (memory[type] === undefined) {
          $log.error('Can\t get all of not existing object type: ' + type + '. Use initialize(Model, datas).');
        }

        return memory[type].all();
      }

      function clearCache() {
        angular.forEach(memory, function(factory) {
          factory.clearCache();
        });
      }

      function proccesResults(results) {
        var objects = {
          data: [],
          included: []
        };

        if (results === undefined) {
          $log.error('Can\'t proccess results:', results);
        }

        var config = {
          saved: true,
          synchronized: true,
          initialization: false
        };

        angular.forEach(results.included, function(data) {
          objects.included.push(getFactory(data.type).cache.addOrUpdate(data, config));
        });

        if (angular.isArray(results.data)) {
          angular.forEach(results.data, function(data) {
            objects.data.push(getFactory(data.type).cache.addOrUpdate(data, config));
          });
        } else {
          objects.data.push(getFactory(results.data.type).cache.addOrUpdate(results.data, config));
        }

        return objects;
      }
    }
  }

})();

