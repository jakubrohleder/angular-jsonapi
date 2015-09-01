(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIFactory', AngularJsonAPIFactoryWrapper);

  function AngularJsonAPIFactoryWrapper(
    AngularJsonAPIModel,
    AngularJsonAPISchema,
    AngularJsonAPICache,
    AngularJsonAPICollection,
    uuid4,
    $log,
    $q
  ) {
    AngularJsonAPIFactory.prototype.get = get;
    AngularJsonAPIFactory.prototype.all = all;
    AngularJsonAPIFactory.prototype.remove = remove;
    AngularJsonAPIFactory.prototype.initialize = initialize;

    AngularJsonAPIFactory.prototype.clear = clear;

    return AngularJsonAPIFactory;

    /**
     * AngularJsonAPIFactory constructor
     * @param {json} schema       Schema object
     * @param {AngularJsonAPISynchronizer} synchronizer Synchronizer for the factory
     */
    function AngularJsonAPIFactory(schema, synchronizer) {
      var _this = this;
      var config = {
        action: 'init'
      };

      _this.schema = new AngularJsonAPISchema(schema);
      _this.cache = new AngularJsonAPICache(_this);

      _this.synchronizer = synchronizer;
      _this.synchronizer.factory = _this;

      _this.Model = AngularJsonAPIModel.model(
        _this.schema,
        _this
      );

      _this.synchronizer.synchronize(config).then(resolved, rejected);

      function resolved(data, finish) {
        _this.cache.fromJson(data);

        finish();
        return data;
      }

      function rejected(errors, finish) {
        finish();

        return errors;
      }
    }

    /**
     * Get request
     * @param  {uuid} id
     * @return {AngularJsonAPIModel} Model associated with id, synchronized
     */
    function get(id) {
      var _this = this;
      var object = _this.__get(id);

      object.fetch();

      return object;
    }

    /**
     * All request
     * @param  {object} params Object associated with params (for filters/pagination etc.)
     * @return {AngularJsonAPICollection} Collection of AngularJsonAPIModel, synchronized
     */
    function all(params) {
      var _this = this;

      var collection = new AngularJsonAPICollection(
        _this,
        angular.extend(params, _this.schema.params.all)
      );

      collection.fetch();

      return collection;
    }

    /**
     * Remove request
     * @param  {uuid} id
     * @return {promise} Promise associated with the synchronization, in case of
     * fail object is reverted to previous state
     */
    function remove(id) {
      var _this = this;
      var object = _this.cache.remove(id);
      var config = {
        action: 'remove',
        object: object
      };

      if (object !== undefined) {
        object.removed = true;

        if (object.isNew) {
          return $q.when(undefined);
        }
      } else {
        $log.error('Object with this id does not exist');
      }

      return _this.synchronizer.synchronize(config).then(resolved, rejected);

      function resolved(data, finish) {
        object.unlinkAll();
        _this.cache.clearRemoved(id);
        finish();

        return data;
      }

      function rejected(errors, finish) {
        if (object !== undefined) {
          object.removed = false;
          _this.cache.revertRemove(id);
        }

        finish();
        return errors;
      }
    }

    /**
     * Initialize new AngularJsonAPIModel
     * @return {AngularJsonAPIModel} New model
     */
    function initialize() {
      var _this = this;

      var model = new _this.Model({
        type: _this.schema.type,
        id: uuid4.generate(),
        attributes: {},
        relationships: {}
      }, true);

      return model;
    }

    /**
     * Clears localy saved data
     * @return {promise} Promise associated with the synchronization resolves to nothing
     */
    function clear() {
      var _this = this;
      _this.cache.clear();
      var config = {
        action: 'clear'
      };

      return _this.synchronizer.synchronize(config).then(resolved, rejected);

      function resolved(data, finish) {
        finish();
      }

      function rejected(errors, finish) {
        finish();

        return errors;
      }
    }
  }
})();
