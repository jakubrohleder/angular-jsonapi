(function() {
  'use strict';

  angular.module('angularJsonapi')
  .provider('$jsonapi', jsonapiProvider);

  function jsonapiProvider($provide) {
    var models = [];
    this.model = model;
    this.$get = jsonapiFactory;

    function model(schema) {
      var name = schema.type.charAt(0).toUpperCase();
      models.push(name);
      $provide.decorator(name, function($delegate) {
        var Model = function(data) {
          $delegate.call(this, data);
        };

        Model.prototype = Object.create($delegate.prototype);
        Model.prototype.constructor = Model;
        Model.prototype.schema = schema;
        Model.prototype.factoryName = name;
      });

      return name;
    }

    function jsonapiFactory($$AngularJsonAPICollection, $injector, $log) {
      var memory = {};
      angular.forEach(models, initialize);
      return {
        create: create,
        get: get,
        all: all,
        several: several
      };
      function initialize() {
        // var Model = $injector.get(modelName);
        // var collection = new $$AngularJsonAPICollection(Model);
        // Model.prototype.collection = collection;
        // memory[Model.schema.type] = collection;
      }

      function create(type, links) {
        if (memory[type] === undefined) {
          $log.error('Can\t add not existing object type: ' + type + '. Use initialize(Model, datas).');
        }

        return memory[type].create(links);
      }

      function get(type, id) {
        if (memory[type] === undefined) {
          $log.error('Can\t get not existing object type: ' + type + '. Use initialize(Model, datas).');
        }

        return memory[type].get(id);
      }

      function all(type) {
        if (memory[type] === undefined) {
          $log.error('Can\t get all of not existing object type: ' + type + '. Use initialize(Model, datas).');
        }

        return memory[type].all();
      }

      function several(type, ids) {
        if (memory[type] === undefined) {
          $log.error('Can\t get all of not existing object type: ' + type + '. Use initialize(Model, datas).');
        }

        return memory[type].several(ids);
      }
    }
  }

})();

