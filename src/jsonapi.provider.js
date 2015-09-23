(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .provider('$jsonapi', jsonapiProvider);

  function jsonapiProvider() {
    var memory = {};
    var names = [];
    this.$get = jsonapiFactory;

    function jsonapiFactory($log, AngularJsonAPIResource) {
      return {
        form: form,
        get: get,
        remove: remove,
        all: all,
        addResource: addResource,
        getResource: getResource,
        clearCache: clearCache,
        proccesResults: proccesResults,

        allResources: allResources,
        listResources: listResources
      };

      function allResources() {
        return memory;
      }

      function listResources() {
        return names;
      }

      function addResource(schema, synchronization) {
        var factory = AngularJsonAPIResource.create(schema, synchronization);

        memory[schema.type] = factory;
        names.push(schema.type);
      }

      function getResource(type) {
        return memory[type];
      }

      function form(type) {
        if (memory[type] === undefined) {
          $log.error('Can\t add not existing object type: ' + type + '. Use initialize.');
        }

        return memory[type].saved.form;
      }

      function get(type, id) {
        if (memory[type] === undefined) {
          $log.error('Can\t get not existing object type: ' + type + '. Use initialize.');
        }

        return memory[type].get(id);
      }

      function remove(type, id) {
        if (memory[type] === undefined) {
          $log.error('Can\t remove not existing object type: ' + type + '. Use initialize.');
        }

        return memory[type].remove(id);
      }

      function all(type) {
        if (memory[type] === undefined) {
          $log.error('Can\t get all of not existing object type: ' + type + '. Use initialize.');
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
          stable: true,
          pristine: false,
          initialization: false
        };

        angular.forEach(results.included, function(data) {
          objects.included.push(getResource(data.type).cache.addOrUpdate(data, config));
        });

        if (angular.isArray(results.data)) {
          angular.forEach(results.data, function(data) {
            objects.data.push(getResource(data.type).cache.addOrUpdate(data, config));
          });
        } else {
          objects.data.push(getResource(results.data.type).cache.addOrUpdate(results.data, config));
        }

        return objects;
      }
    }
  }

})();

