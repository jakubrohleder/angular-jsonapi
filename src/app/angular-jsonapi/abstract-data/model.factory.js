(function() {
  'use strict';

  angular.module('angularJsonapi')
  .factory('JsonAPIModelFactory', JsonAPIModelFactory);

  function JsonAPIModelFactory(AngularJsonAPIAbstractData, $log) {

    return {
      model: modelFactory
    };

    function modelFactory(schema, linkGetters) {
      var name = schema.type.charAt(0).toUpperCase();
      var Model = function(data) {
        var _this = this;

        if (data.type !== _this.schema.type) {
          $log.error('Data type other then declared in schema: ', data.type, ' instead of ', _this.schema.type);
        }

        AngularJsonAPIAbstractData.call(_this, _this.schema, data);

        _this.form.parent = _this;
      };

      Model.prototype = Object.create(AngularJsonAPIAbstractData.prototype);
      Model.prototype.constructor = Model;
      Model.prototype.schema = schema;
      Model.prototype.linkGetters = linkGetters;
      Model.prototype.factoryName = name;

      Model.prototype.update = function(data) {
        return AngularJsonAPIAbstractData.prototype.update.call(this, schema, data);
      };

      // Model.prototype.validateData = function(data) {
      //   return AngularJsonAPIAbstractData.prototype.__validateData.call(this, schema, data);
      // };

      // Model.prototype.validateField = function(data, key) {
      //   return AngularJsonAPIAbstractData.prototype.__validateField.call(this, schema, data, key);
      // };

      return Model;
    }

  }
})();
