(function() {
  'use strict';

  angular.module('angularJsonapi')
  .factory('JsonAPIModelFactory', JsonAPIModelFactory);

  function JsonAPIModelFactory(AngularJsonAPIAbstractData, $log) {

    return {
      model: modelFactory
    };

    function modelFactory(schema, synchronizations, linkGetters, collection) {
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
      Model.prototype.synchronizations = synchronizations;
      Model.prototype.linkGetters = linkGetters;

      Model.prototype.collection = collection;

      Model.prototype.__update = function(data) {
        return AngularJsonAPIAbstractData.prototype.__update.call(this, schema, synchronizations, data);
      };

      Model.prototype.refresh = function() {
        return AngularJsonAPIAbstractData.prototype.refresh.call(this, synchronizations);
      };

      Model.prototype.remove = function() {
        return AngularJsonAPIAbstractData.prototype.remove.call(this, collection, synchronizations);
      };

      return Model;
    }

  }
})();
