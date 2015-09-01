(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPICache', AngularJsonAPICacheWrapper);

  function AngularJsonAPICacheWrapper(
    $log
  ) {

    AngularJsonAPICache.prototype.get = get;
    AngularJsonAPICache.prototype.addOrUpdate = addOrUpdate;

    AngularJsonAPICache.prototype.fromJson = fromJson;
    AngularJsonAPICache.prototype.toJson = toJson;
    AngularJsonAPICache.prototype.clear = clear;

    AngularJsonAPICache.prototype.remove = remove;
    AngularJsonAPICache.prototype.revertRemove = revertRemove;
    AngularJsonAPICache.prototype.clearRemoved = clearRemoved;

    return AngularJsonAPICache;

    /**
     * Constructor
     */
    function AngularJsonAPICache(factory) {
      var _this = this;

      _this.factory = factory;
      _this.data = {};
      _this.removed = {};
      _this.size = 0;
    }

    /**
     * Add new model or update existing with data
     * @param {object} validatedData Data that are used to update or create an object, has to be valid
     * @return {AngularJsonAPIModel} Created model
     */
    function addOrUpdate(validatedData) {
      var _this = this;
      var id = validatedData.id;

      if (id === undefined) {
        $log.error('Can\'t add data without id!', validatedData);
        return;
      }

      if (_this.data[id] === undefined) {
        _this.data[id] = new _this.factory.Model(validatedData);
        _this.size += 1;
      } else {
        _this.data[id].__update(validatedData);
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

      if (collection !== null && collection.data !== undefined) {
        _this.updatedAt = collection.updatedAt;

        angular.forEach(collection.data, function(objectData) {
          var data = objectData.data;
          _this.addOrUpdate(data, objectData.updatedAt);
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
        data: {},
        updatedAt: _this.updatedAt
      };

      angular.forEach(_this.data, function(object, key) {
        json.data[key] = object.toJson();
      });

      return angular.toJson(json);
    }

    /**
     * Clear memory
     * @return {undefined}
     */
    function clear() {
      var _this = this;

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

      if (_this.data[id] === undefined) {
        _this.data[id] = new _this.factory.Model({id: id, type: _this.Model.prototype.schema.type});
      }

      return _this.data[id];
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
