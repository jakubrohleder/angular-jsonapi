(function() {
  'use strict';

  angular.module('angularJsonapi')
  .factory('AngularJsonAPICollection', AngularJsonAPICollectionWrapper);

  function AngularJsonAPICollectionWrapper(JsonAPIModelFactory, $log, $rootScope, uuid4) {

    AngularJsonAPICollection.prototype.__add = __add;
    AngularJsonAPICollection.prototype.__synchronize = __synchronize;
    AngularJsonAPICollection.prototype.__get = __get;
    AngularJsonAPICollection.prototype.__remove = __remove;

    AngularJsonAPICollection.prototype.get = get;
    AngularJsonAPICollection.prototype.all = all;
    AngularJsonAPICollection.prototype.remove = remove;
    AngularJsonAPICollection.prototype.all = all;

    return AngularJsonAPICollection;

    function AngularJsonAPICollection(schema, synchronizations) {
      var _this = this;

      _this.Model = JsonAPIModelFactory.model(
        schema,
        synchronizations,
        _this.all,
        _this
      );

      _this.synchronizations = synchronizations;

      _this.data = {};
      _this.removed = {};

      _this.dummy = new _this.Model({type: schema.type});
      _this.dummy.form.save = __saveDummy.bind(_this.dummy);
      _this.all[schema.type] = _this;
    }

    function __add(validatedData) {
      var _this = this;
      if (validatedData.id === undefined) {
        $log.error('Can\'t add data without id!', validatedData);
        return;
      } else if (_this.data[validatedData.id] !== undefined) {
        $log.error('Model with id already exists!', validatedData.id);
        return;
      }

      _this.data[validatedData.id] = new this.Model(validatedData);

      return _this.data[validatedData.id];
    }

    function __get(id) {
      var _this = this;

      return _this.data[id];
    }

    function get(id) {
      var _this = this;
      if (angular.isArray(id)) {
        var result = [];
        angular.forEach(id, function(id) {
          result.push(_this.__get(id));
        });

        return result;
      }

      _this.__synchronize('get', id);

      return _this.__get(id);
    }

    function all() {
      var _this = this;

      _this.__synchronize('all');

      return this;
    }

    function __remove(id) {
      var _this = this;
      var object = _this.data[id];

      _this.removed[id] = object;
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

      _this.__synchronize('remove');
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
        newModel = _this.parentCollection.__add(data);
        _this.form.reset();
        newModel.__synchronize('add');
      }
    }

    function __synchronize(key, extra) {
      $log.log('Synchro Collection', this.Model.prototype.schema.type, key);
    }
  }
})();
