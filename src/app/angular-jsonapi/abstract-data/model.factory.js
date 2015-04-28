(function() {
  'use strict';

  angular.module('angularJsonapi')
  .factory('JsonAPIModelFactory', JsonAPIModelFactory);

  function JsonAPIModelFactory(AngularJsonAPIAbstractData, $log) {

    return {
      model: modelFactory
    };

    function modelFactory(schema, synchronizationHooks, linkedCollections, parentCollection) {
      var Model = function(data) {
        var _this = this;

        if (data.type !== _this.schema.type) {
          $log.error('Data type other then declared in schema: ', data.type, ' instead of ', _this.schema.type);
        }

        AngularJsonAPIAbstractData.call(_this, _this.schema, linkedCollections, data);

        _this.form.parent = _this;
      };

      Model.prototype = Object.create(AngularJsonAPIAbstractData.prototype);
      Model.prototype.constructor = Model;

      Model.prototype.schema = schema;
      Model.prototype.synchronizationHooks = synchronizationHooks;
      Model.prototype.linkedCollections = linkedCollections;

      Model.prototype.parentCollection = parentCollection;

      Model.prototype.__update = function(data) {
        return AngularJsonAPIAbstractData.prototype.__update.call(
          this, schema, synchronizationHooks, data
        );
      };

      Model.prototype.refresh = function() {
        return AngularJsonAPIAbstractData.prototype.refresh.call(
          this, synchronizationHooks
        );
      };

      Model.prototype.remove = function() {
        return AngularJsonAPIAbstractData.prototype.remove.call(
          this, parentCollection, synchronizationHooks
        );
      };

      Model.prototype.addLink = function(linkKey, linkedObject) {
        return AngularJsonAPIAbstractData.prototype.addLink.call(
          this, schema, synchronizationHooks, linkedCollections, linkKey, linkedObject
        );
      };

      Model.prototype.removeLink = function(linkKey, linkedObject, reflection) {
        return AngularJsonAPIAbstractData.prototype.removeLink.call(
          this, schema, synchronizationHooks, linkedCollections, linkKey, linkedObject, reflection
        );
      };

      return Model;
    }

  }
})();
