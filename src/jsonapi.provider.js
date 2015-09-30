(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .provider('$jsonapi', jsonapiProvider);

  function jsonapiProvider(validateJS) {
    var memory = {};
    var names = [];
    this.$get = jsonapiFactory;

    function jsonapiFactory($log, AngularJsonAPIResource) {
      return {
        addResource: addResource,
        getResource: getResource,
        clearCache: clearCache,
        allResources: allResources,
        listResources: listResources,
        addValidator: addValidator,

        __proccesResults: __proccesResults
      };

      function addResource(schema, synchronization) {
        var resource = AngularJsonAPIResource.create(schema, synchronization);

        memory[schema.type] = resource;
        names.push(schema.type);
      }

      function getResource(type) {
        return memory[type];
      }

      function allResources() {
        return memory;
      }

      function listResources() {
        return names;
      }

      function clearCache() {
        angular.forEach(memory, function(resource) {
          resource.clearCache();
        });
      }

      function addValidator(name, validator) {
        if (!angular.isString(name)) {
          $log.error('Validator name is not a string', name);
          return;
        } else if (validateJS.validators[name] === undefined) {
          $log.warn('Redeclaring validator', name);
        }

        validateJS.validators[name] = validator;
      }

      function __proccesResults(results) {
        var objects = {
          data: [],
          included: []
        };

        if (results === undefined) {
          $log.error('Can\'t proccess results:', results);
        }

        var config = {
          new: false,
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

