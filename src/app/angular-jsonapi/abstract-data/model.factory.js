(function() {
  'use strict';

  angular.module('angularJsonapi')
  .factory('JsonAPIModelFactory', JsonAPIModelFactory);

  function JsonAPIModelFactory(AngularJsonAPIAbstractData, AngularJsonAPISchema, $log) {

    return {
      model: modelFactory
    };

    function modelFactory(schema, linkedCollections, parentCollection) {
      var Model = function(data, updatedAt, dummy) {
        var _this = this;

        if (data.type !== _this.schema.type) {
          $log.error('Data type other then declared in schema: ', data.type, ' instead of ', _this.schema.type);
        }

        AngularJsonAPIAbstractData.call(_this, data, updatedAt, dummy);

        _this.form.parent = _this;
      };

      Model.prototype = Object.create(AngularJsonAPIAbstractData.prototype);
      Model.prototype.constructor = Model;

      Model.prototype.schema = new AngularJsonAPISchema(schema);
      Model.prototype.linkedCollections = linkedCollections;
      Model.prototype.parentCollection = parentCollection;

      angular.forEach(schema.functions, function(metaFunction, metaFunctionName) {
        Model.prototype[metaFunctionName] = function() {
          return metaFunction.call(this);
        };
      });

      return Model;
    }

  }
})();
