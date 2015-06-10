(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPICollection', AngularJsonAPICollectionWrapper);

  function AngularJsonAPICollectionWrapper(
    $log,
    uuid4,
    JsonAPIModelFactory,
    AngularJsonAPISchema
  ) {
    AngularJsonAPICollection.prototype.allCollections = {};

    AngularJsonAPICollection.prototype.__synchronize = __synchronize;
    AngularJsonAPICollection.prototype.__get = __get;
    AngularJsonAPICollection.prototype.__remove = __remove;

    AngularJsonAPICollection.prototype.get = get;
    AngularJsonAPICollection.prototype.all = all;
    AngularJsonAPICollection.prototype.refresh = all;
    AngularJsonAPICollection.prototype.remove = remove;
    AngularJsonAPICollection.prototype.clear = clear;
    AngularJsonAPICollection.prototype.fromJson = fromJson;
    AngularJsonAPICollection.prototype.toJson = toJson;
    AngularJsonAPICollection.prototype.addOrUpdate = addOrUpdate;
    AngularJsonAPICollection.prototype.hasErrors = hasErrors;

    return AngularJsonAPICollection;

    function AngularJsonAPICollection(schema, synchronization) {
      var _this = this;

      var schemaObj = new AngularJsonAPISchema(schema);

      _this.Model = JsonAPIModelFactory.model(
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

      _this.new = new _this.Model({
        type: schema.type,
        attributes: {},
        relationships: {}
      }, undefined, true);

      _this.new.form.save = __saveNew.bind(_this.new);
      _this.new.form.addLink = __addLinkNew.bind(_this.new);
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
        _this.data[id] = new _this.Model({id: id, type: _this.Model.prototype.schema.type}, undefined, true);
      }

      return _this.data[id];
    }

    function get(id, filters) {
      var _this = this;
      var result;
      var params = [];

      if (_this.schema.params.get.length > 0) {
        params.push(_this.schema.params.get);
      }

      angular.forEach(filters, function(value, key) {
        params.push('filter[' + key + ']=' + value);
      });

      if (angular.isArray(id)) {
        result = [];
        angular.forEach(id, function(id) {
          result.push(_this.__get(id));
        });
      } else {
        result = _this.__get(id);
      }

      _this.__synchronize('get', result, undefined, undefined, params.join('&'));

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

      _this.__synchronize('clear');
    }

    function __remove(id) {
      var _this = this;
      var object = _this.data[id];

      _this.removed[id] = object;
      _this.updatedAt = Date.now();

      delete _this.data[id];
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

      _this.__synchronize('remove', object);
    }

    function __saveNew() {
      var _this = this;
      var errors = _this.form.validate();
      var newModel;

      if (angular.equals(errors, {})) {
        var data = angular.copy(_this.form.data);
        if (data.id === undefined) {
          data.id = uuid4.generate();
        } else if (!uuid4.validate(data.id)) {
          $log.error('Wrong id of new data!');
          return;
        }

        data.type = _this.schema.type;
        newModel = _this.parentCollection.addOrUpdate(data);
        _this.form.reset();
        _this.relationships = {};
        _this.parentCollection.__synchronize('add', newModel);
      }

      return newModel;
    }

    function __addLinkNew(linkKey, linkedObject) {
      var _this = this;
      if (_this.schema.relationships[linkKey] === undefined) {
        $log.error('Link\'', linkKey, '\'not present in schema of', _this.data.type, _this);
        return;
      }

      if (_this.schema.relationships[linkKey].type === 'hasOne') {
        _this.form.data.relationships[linkKey] = {
          data: {
            type: linkedObject.data.type,
            id: linkedObject.data.id
          }
        };
      } else {
        _this.form.data.relationships[linkKey].data = _this.form.data.relationships[linkKey].data || [];
        _this.form.data.relationships[linkKey].data.push({
          type: linkedObject.data.type,
          id: linkedObject.data.id
        });
      }
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
    }
  }
})();
