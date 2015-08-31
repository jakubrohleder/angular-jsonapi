(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIFactory', AngularJsonAPIFactoryWrapper);

  function AngularJsonAPIFactoryWrapper(
    $log,
    uuid4,
    AngularJsonAPIModel,
    AngularJsonAPISchema
  ) {
    AngularJsonAPIFactory.prototype.allCollections = {};

    AngularJsonAPIFactory.prototype.__synchronize = __synchronize;
    AngularJsonAPIFactory.prototype.__get = __get;
    AngularJsonAPIFactory.prototype.__remove = __remove;

    AngularJsonAPIFactory.prototype.get = get;
    AngularJsonAPIFactory.prototype.all = all;
    AngularJsonAPIFactory.prototype.remove = remove;
    AngularJsonAPIFactory.prototype.initialize = initialize;

    AngularJsonAPIFactory.prototype.clear = clear;

    AngularJsonAPIFactory.prototype.fromJson = fromJson;
    AngularJsonAPIFactory.prototype.toJson = toJson;

    AngularJsonAPIFactory.prototype.addOrUpdate = addOrUpdate;
    AngularJsonAPIFactory.prototype.hasErrors = hasErrors;

    return AngularJsonAPIFactory;

    function AngularJsonAPIFactory(schema, synchronization) {
      var _this = this;

      var schemaObj = new AngularJsonAPISchema(schema);

      _this.Model = AngularJsonAPIModel.model(
        schemaObj,
        _this.allCollections,
        _this
      );

      _this.synchronization = synchronization;

      _this.loadingCount = 0;
      _this.data = {};
      _this.removed = {};
      _this.promises = {};
      _this.schema = schemaObj;
      _this.length = 0;

      _this.allCollections[schema.type] = _this;

      _this.__synchronize('init');

      _this.errors = {};
    }

    function hasErrors() {
      var _this = this;
      var result = false;

      angular.forEach(_this.errors, function(error) {
        if (error !== undefined) {
          result = true;
        }
      });

      return result;
    }

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

    function addOrUpdate(validatedData, updatedAt) {
      var _this = this;
      if (validatedData.id === undefined) {
        $log.error('Can\'t add data without id!', validatedData);
        return;
      }

      if (_this.data[validatedData.id] === undefined) {
        _this.data[validatedData.id] = new this.Model(validatedData, updatedAt);
        _this.length += 1;
      } else {
        _this.data[validatedData.id].__setData(validatedData, updatedAt);
        _this.data[validatedData.id].__setLinks(validatedData.relationships);
      }

      _this.data[validatedData.id].__setUpdated(updatedAt);

      return _this.data[validatedData.id];
    }

    function __get(id) {
      var _this = this;

      if (_this.data[id] === undefined) {
        _this.data[id] = new _this.Model({id: id, type: _this.Model.prototype.schema.type}, undefined);
      }

      return _this.data[id];
    }

    function get(id) {
      var _this = this;
      var result = _this.__get(id);
      var params = _this.schema.params.get;

      _this.__synchronize('get', result, undefined, undefined, params);

      return result;
    }

    function all() {
      var _this = this;
      _this.__synchronize('all', undefined, undefined, undefined, _this.schema.params.all);

      return _this;
    }

    function clear() {
      var _this = this;
      _this.updatedAt = Date.now();
      _this.data = {};
      _this.length = 0;

      return _this.__synchronize('clear');
    }

    function __remove(id) {
      var _this = this;
      var object = _this.data[id];

      _this.removed[id] = object;
      _this.updatedAt = Date.now();

      delete _this.data[id];

      _this.length -= 1;
    }

    function remove(id) {
      var _this = this;
      var object = _this.data[id];

      if (object !== undefined) {
        _this.__remove(id);
        object.__remove(id);
      } else {
        $log.error('Object with this id does not exist');
      }

      return _this.__synchronize('remove', object);
    }

    function initialize() {
      var _this = this;

      var model = new _this.Model({
        type: _this.schema.type,
        id: uuid4.generate(),
        attributes: {},
        relationships: {}
      }, undefined, true);

      return model;
    }

    function __synchronize(action, object, linkKey, linkedObject, params) {
      var _this = this;
      var promise;

      $log.debug('Synchro Collection', this.Model.prototype.schema.type, {action: action, object: object, linkKey: linkKey, linkedObject: linkedObject, params: params});

      promise = _this.synchronization.synchronize(action, _this, object, linkKey, linkedObject, params);
      if (object !== undefined) {
        object.promises[action] = promise;
      } else {
        _this.promises[action] = promise;
      }

      return promise;
    }
  }
})();
