(function() {
  'use strict';

  angular.module('angularJsonapi')
  .factory('AngularJsonAPICollection', AngularJsonAPICollectionWrapper);

  function AngularJsonAPICollectionWrapper(
    $log,
    uuid4,
    JsonAPIModelFactory
  ) {
    AngularJsonAPICollection.prototype.allCollections = {};

    AngularJsonAPICollection.prototype.__synchronize = __synchronize;
    AngularJsonAPICollection.prototype.__get = __get;
    AngularJsonAPICollection.prototype.__remove = __remove;

    AngularJsonAPICollection.prototype.get = get;
    AngularJsonAPICollection.prototype.all = all;
    AngularJsonAPICollection.prototype.remove = remove;
    AngularJsonAPICollection.prototype.clear = clear;
    AngularJsonAPICollection.prototype.fromJson = fromJson;
    AngularJsonAPICollection.prototype.toJson = toJson;
    AngularJsonAPICollection.prototype.addOrUpdate = addOrUpdate;

    return AngularJsonAPICollection;

    function AngularJsonAPICollection(schema, synchronization) {
      var _this = this;

      _this.Model = JsonAPIModelFactory.model(
        schema,
        _this.allCollections,
        _this
      );

      _this.synchronization = synchronization;

      _this.loadingCount = 0;
      _this.data = {};
      _this.removed = {};
      _this.schema = schema;

      _this.dummy = new _this.Model({type: schema.type}, undefined, true);
      _this.dummy.form.save = __saveDummy.bind(_this.dummy);
      _this.allCollections[schema.type] = _this;

      _this.__synchronize('init');
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
        _this.data[validatedData.id].__setLinks(validatedData.links);
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

    function get(id) {
      var _this = this;
      var result;

      if (angular.isArray(id)) {
        result = [];
        angular.forEach(id, function(id) {
          result.push(_this.__get(id));
        });
      } else {
        result = _this.__get(id);
      }

      _this.__synchronize('get', result);

      return result;
    }

    function all() {
      var _this = this;

      _this.__synchronize('all');

      return _this.data;
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

    function __saveDummy() {
      var _this = this;
      var errors = _this.form.validate();
      var newModel;

      if (angular.equals(errors, {})) {
        var data = angular.copy(_this.form.data);
        if (data.id === undefined) {
          data.id = uuid4.generate();
        } else if (!uuid4.validate(data.id)) {
          $log.error('Wrong id of dummy data!');
          return;
        }

        data.links = {};

        data.type = _this.schema.type;
        newModel = _this.parentCollection.addOrUpdate(data);
        _this.form.reset();
        _this.parentCollection.__synchronize('add', _this);
      }
    }

    function __synchronize(action, object, linkKey, linkedObject) {
      var _this = this;
      $log.log('Synchro Collection', this.Model.prototype.schema.type, action, object);

      _this.synchronization.synchronize(action, _this, object, linkKey, linkedObject);
    }
  }
})();
