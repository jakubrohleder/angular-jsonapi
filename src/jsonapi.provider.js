(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .provider('$jsonapi', jsonapiProvider);

  function jsonapiProvider() {
    var memory = {};
    this.$get = jsonapiFactory;

    function jsonapiFactory($log, AngularJsonAPICollection) {
      return {
        form: form,
        get: get,
        remove: remove,
        all: all,
        addModel: addModel,
        getModel: getModel,
        clearAll: clearAll
      };

      function addModel(schema, synchronization) {
        var collection = new AngularJsonAPICollection(schema, synchronization);

        memory[schema.type] = collection;
      }

      function getModel(type) {
        return memory[type];
      }

      function form(type) {
        if (memory[type] === undefined) {
          $log.error('Can\t add not existing object type: ' + type + '. Use initialize(Model, datas).');
        }

        return memory[type].isNew.form;
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
        angular.forEach(memory, function(collection) {
          collection.clear();
        });
      }
    }
  }

})();

