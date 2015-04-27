(function() {
  'use strict';

  angular.module('angularJsonapi')
  .factory('AngularJsonAPICollection', AngularJsonAPICollectionWrapper);

  function AngularJsonAPICollectionWrapper(JsonAPIModelFactory, $log, $rootScope, uuid4) {

    AngularJsonAPICollection.prototype.__add = __add;
    AngularJsonAPICollection.prototype.get = get;
    AngularJsonAPICollection.prototype.all = all;
    AngularJsonAPICollection.prototype.several = several;
    AngularJsonAPICollection.prototype.remove = remove;

    return AngularJsonAPICollection;

    function AngularJsonAPICollection(schema, synchronizations, linkGetters) {
      var _this = this;

      _this.Model = JsonAPIModelFactory.model(
        schema,
        synchronizations,
        linkGetters,
        _this
      );

      _this.data = {};
      _this.removed = {};

      _this.dummy = new _this.Model({type: schema.type});
      _this.dummy.form.save = __saveDummy.bind(_this.dummy);
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

    }

    function get(id) {
      var _this = this;

      if (_this.data[id] === undefined) {
        _this.create([], id);
      }

      $rootScope.$broadcast('angular-json:get', _this.data[id]);

      return _this.data[id];
    }

    function several(ids) {
      var _this = this;
      var datas = [];
      angular.forEach(ids, function(id) {
        if (_this.data[id] === undefined) {
          _this.create([], id);
        }

        datas.push(_this.data[id]);
      });

      $rootScope.$broadcast('angular-json:several', datas);

      return _this.datas;
    }

    function all() {
      var _this = this;

      $rootScope.$broadcast('angular-json:all', _this);

      return this;
    }

    function remove(id) {
      var _this = this;

      if (_this.data[id] !== undefined) {
        _this.removed[id] = _this.data[id];
        delete _this.data[id];
      }
    }

    function __saveDummy() {
      var _this = this;
      var errors = _this.form.validate();

      if (angular.equals(errors, {})) {
        var data = angular.copy(_this.form.data);
        data.id = uuid4.generate();
        data.type = _this.schema.type;
        _this.collection.__add(data);
        _this.form.reset();
        _this.__synchronize('add', _this.synchronizations);
      }
    }
  }
})();
