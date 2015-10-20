(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIResourceCache', AngularJsonAPIResourceCacheWrapper);

  function AngularJsonAPIResourceCacheWrapper(
    uuid4,
    $log
  ) {

    AngularJsonAPIResourceCache.prototype.get = get;
    AngularJsonAPIResourceCache.prototype.index = index;
    AngularJsonAPIResourceCache.prototype.setIndexIds = setIndexIds;
    AngularJsonAPIResourceCache.prototype.addOrUpdate = addOrUpdate;

    AngularJsonAPIResourceCache.prototype.fromJson = fromJson;
    AngularJsonAPIResourceCache.prototype.toJson = toJson;
    AngularJsonAPIResourceCache.prototype.clear = clear;

    AngularJsonAPIResourceCache.prototype.remove = remove;
    AngularJsonAPIResourceCache.prototype.revertRemove = revertRemove;
    AngularJsonAPIResourceCache.prototype.clearRemoved = clearRemoved;

    return {
      create: AngularJsonAPIResourceCacheFactory
    };

    function AngularJsonAPIResourceCacheFactory(resource) {
      return new AngularJsonAPIResourceCache(resource);
    }

    /**
     * Constructor
     */
    function AngularJsonAPIResourceCache(resource) {
      var _this = this;

      _this.resource = resource;
      _this.data = {};
      _this.removed = {};
      _this.size = 0;

      _this.indexIds = undefined;
    }

    /**
     * Add new model or update existing with data
     * @param {object} validatedData Data that are used to update or create an object, has to be valid
     * @return {AngularJsonAPIModel} Created model
     */
    function addOrUpdate(validatedData, config, updatedAt) {
      var _this = this;
      var id = validatedData.id;

      if (id === undefined) {
        $log.error('Can\'t add data without id!', validatedData);
        return;
      }

      if (_this.data[id] === undefined) {
        _this.data[id] = _this.resource.modelFactory(validatedData, config, updatedAt);
        _this.size += 1;
      } else {
        _this.data[id].update(validatedData, !config.new, config.initialization);
      }

      return _this.data[id];
    }


    /**
     * Recreate object structure from json data
     * @param  {json} json Json data
     * @return {undefined}
     */
    function fromJson(json) {
      var _this = this;
      var collection = angular.fromJson(json);

      var config = {
        new: false,
        synchronized: false,
        stable: false,
        pristine: false,
        initialization: true
      };

      if (angular.isObject(collection) && collection.data !== undefined) {
        _this.updatedAt = collection.updatedAt;
        _this.indexIds = collection.indexIds;

        angular.forEach(collection.data, function(objectData) {
          var data = objectData.data;
          _this.addOrUpdate(data, config, objectData.updatedAt);
        });
      }
    }

    /**
     * Encodes memory into json format
     * @return {json} Json encoded memory
     */
    function toJson() {
      var _this = this;
      var json = {
        data: [],
        updatedAt: _this.updatedAt,
        indexIds: _this.indexIds
      };

      angular.forEach(_this.data, function(object) {
        if (object.hasErrors() === false) {
          json.data.push(object.toJson());
        }
      });

      return angular.toJson(json);
    }

    /**
     * Clear memory
     * @return {undefined}
     */
    function clear() {
      var _this = this;

      _this.indexIds = undefined;
      _this.data = {};
      _this.removed = {};
    }

    /**
     * Low level get used internally, does not run any synchronization
     * @param  {uuid} id
     * @return {AngularJsonAPIModel} Model associated with id
     */
    function get(id) {
      var _this = this;

      var data = {
        id: id,
        type: _this.resource.schema.type
      };

      var config = {
        new: false,
        synchronized: false,
        stable: false,
        pristine: true
      };

      if (_this.data[id] === undefined) {
        _this.data[id] = _this.resource.modelFactory(data, config);
      }

      return _this.data[id];
    }

    /**
     * Low level get used internally, does not run any synchronization, used for index requests
     * @param  {objec} params
     * @return {AngularJsonAPIModel} Model associated with id
     */
    function index(params) {
      var _this = this;
      params = params || {};

      if (_this.indexIds === undefined) {
        return _this.indexIds;
      }

      return _this.indexIds.map(_this.get.bind(_this)).filter(filter);

      function filter(argument) {
        var filterParams  = params.filter;
        var valid = true;

        angular.forEach(filterParams, function(constraint) {
          valid = valid && argument.data.attributes[constraint.key] === constraint.value;
        });

        return valid;
      }
    }

    /**
     * Cache ids of objects returned by index request
     * @param {ids array or AngularJsonAPIModel array} array Objects or ids to be cached
     */
    function setIndexIds(array) {
      var _this = this;

      _this.indexIds = [];

      angular.forEach(array, function(element) {
        if (angular.isString(element) && _this.resource.schema.id.validate(element)) {
          _this.indexIds.push(element);
        } else if (angular.isObject(element) && _this.resource.schema.id.validate(element.data.id)) {
          _this.indexIds.push(element.data.id);
        }
      });
    }

    /**
     * Remove object with given id from cache
     * @param  {uuid} id
     * @return {AngularJsonAPIModel / undefined}    Removed object, undefined if
     * object does not exist
     */
    function remove(id) {
      var _this = this;

      if (_this.data[id] !== undefined) {
        _this.removed[id] = _this.data[id];
        delete _this.data[id];
        _this.size -= 1;
      }

      return _this.removed[id];
    }

    /**
     * Revert removal of an object with given id from cache
     * @param  {uuid} id
     * @return {AngularJsonAPIModel / undefined}    Removed object, undefined if
     * object does not exist
     */
    function revertRemove(id) {
      var _this = this;

      if (_this.removed[id] !== undefined) {
        _this.data[id] = _this.removed[id];
        delete _this.removed[id];
        _this.size += 1;
      }

      return _this.data[id];
    }

    /**
     * Clear removed object from memory
     * @param  {uuid} id
     * @return {undefined}
     */
    function clearRemoved(id) {
      var _this = this;

      delete _this.removed[id];
    }
  }
})();
