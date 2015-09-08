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
        clearAll: clearAll,
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

      function clearAll() {
        angular.forEach(memory, function(factory) {
          factory.clear();
        });
      }

      function proccesResults(results) {
        if (results === undefined) {
          $log.error('Can\'t proccess results:', results);
        }

        angular.forEach(results.included, function(data) {
          getFactory(data.type).cache.addOrUpdate(data, true);
        });

        if (angular.isArray(results.data)) {
          var objects = [];
          angular.forEach(results.data, function(data) {
            objects.push(getFactory(data.type).cache.addOrUpdate(data, true));
          });

          return objects;
        } else {
          return getFactory(results.data.type).cache.addOrUpdate(results.data, true);
        }
      }
    }
  }

})();

