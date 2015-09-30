(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModel', AngularJsonAPIModel);

  function AngularJsonAPIModel(
    AngularJsonAPIAbstractModel,
    AngularJsonAPISchema,
    namedFunction,
    pluralize,
    $log
  ) {

    return {
      modelFactory: createModelFactory
    };

    function createModelFactory(schemaObj, resource) {
      var constructorName = pluralize.plural(schemaObj.type, 1);

      var Model = namedFunction(constructorName, function(data, config, updatedAt) {
        var _this = this;

        if (data.type !== _this.schema.type) {
          $log.error('Data type other then declared in schema: ', data.type, ' instead of ', _this.schema.type);
        }

        AngularJsonAPIAbstractModel.call(_this, data, config, updatedAt);

        _this.form.parent = _this;
      });

      Model.prototype = Object.create(AngularJsonAPIAbstractModel.prototype);
      Model.prototype.constructor = Model;

      Model.prototype.schema = schemaObj;
      Model.prototype.resource = resource;
      Model.prototype.synchronize = resource.synchronizer.synchronize.bind(resource.synchronizer);

      angular.forEach(schemaObj.functions, function(metaFunction, metaFunctionName) {
        Model.prototype[metaFunctionName] = function() {
          return metaFunction.apply(this, arguments);
        };
      });

      return modelFactory;

      function modelFactory(data, updatedAt, isNew) {
        return new Model(data, updatedAt, isNew);
      }
    }
  }
})();
