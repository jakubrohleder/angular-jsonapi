(function() {
  'use strict';

  angular.module('angularJsonapi')
  .factory('AngularJsonAPICollection', AngularJsonAPICollectionWrapper);

  function AngularJsonAPICollectionWrapper(JsonAPIModelFactory, $log, $rootScope, uuid4) {

    AngularJsonAPICollection.prototype.__add = __add;
    AngularJsonAPICollection.prototype.get = get;
    AngularJsonAPICollection.prototype.all = all;
    AngularJsonAPICollection.prototype.remove = remove;
    AngularJsonAPICollection.prototype.all = {};

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

    function get(id) {
      var _this = this;
      if (angular.isArray(id)) {
        var result = [];
        angular.forEach(id, function(id) {
          result.push(get(id));
        });

        return result;
      }

      if (_this.data[id] === undefined) {
        _this.create([], id);
      }

      $rootScope.$broadcast('angular-json:get', _this.data[id]);

      return _this.data[id];
    }

    function all() {
      var _this = this;

      $rootScope.$broadcast('angular-json:all', _this);

      return this;
    }

    function remove(id) {
      var _this = this;
      var object = _this.data[id];

      if (object !== undefined) {
        _this.removed[id] = object;
        delete _this.data[id];
      }
    }

    function __saveDummy() {
      var _this = this;
      var errors = _this.form.validate();

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
        _this.parentCollection.__add(data);
        _this.form.reset();
        _this.__synchronize('add', _this.synchronizations);
      }
    }
  }
})();
