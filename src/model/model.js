(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModel', AngularJsonAPIModel);

  function AngularJsonAPIModel(AngularJsonAPIAbstractModel, AngularJsonAPISchema, $log) {

    return {
      model: modelFactory
    };

    function modelFactory(schemaObj, parentFactory) {
      var Model = function(data, updatedAt, isNew) {
        var _this = this;

        if (data.type !== _this.schema.type) {
          $log.error('Data type other then declared in schema: ', data.type, ' instead of ', _this.schema.type);
        }

        AngularJsonAPIAbstractModel.call(_this, data, updatedAt, isNew);

        _this.form.parent = _this;
      };

      Model.prototype = Object.create(AngularJsonAPIAbstractModel.prototype);
      Model.prototype.constructor = Model;

      Model.prototype.schema = schemaObj;
      Model.prototype.parentFactory = parentFactory;
      Model.prototype.synchronize = parentFactory.synchronizer.synchronize;

      angular.forEach(schemaObj.functions, function(metaFunction, metaFunctionName) {
        Model.prototype[metaFunctionName] = function() {
          return metaFunction.apply(this, arguments);
        };
      });

      return Model;
    }

  }
})();
