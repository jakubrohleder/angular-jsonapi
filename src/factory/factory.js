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

      _this.new = new _this.Model({
        type: schema.type,
        attributes: {},
        relationships: {}
      }, undefined, true);

      _this.new.form.save = __saveNew.bind(_this.new);
      _this.new.form.addLink = __addLinkNew.bind(_this.new);

      _this.new.reset = __reset.bind(_this.new);
      _this.new.detach = __detach.bind(_this.new);

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
      var result;
      var params = _this.schema.params.get;

      if (angular.isArray(id)) {
        result = [];
        angular.forEach(id, function(id) {
          result.push(_this.__get(id));
        });
      } else {
        result = _this.__get(id);
      }

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
        _this.reset();
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

    function __reset() {
      var _this = this;

      _this.form.reset();
      _this.relationships = {};
    }

    function __detach() {
      var _this = this;
      var detached = angular.copy(_this);

      _this.reset();

      detached.form.save = __saveNew.bind(detached);
      detached.form.addLink = __addLinkNew.bind(detached);
      detached.reset = __reset.bind(detached);
      detached.detach = __detach.bind(detached);

      return detached;
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
