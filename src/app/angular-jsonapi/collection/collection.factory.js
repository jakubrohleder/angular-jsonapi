(function() {
  'use strict';

  angular.module('angularJsonapi')
  .factory('AngularJsonAPICollection', AngularJsonAPICollectionWrapper);

  function AngularJsonAPICollectionWrapper(JsonAPIModelFactory, $log, $rootScope, uuid4) {

    AngularJsonAPICollection.prototype.add = add;
    AngularJsonAPICollection.prototype.get = get;
    AngularJsonAPICollection.prototype.all = all;
    AngularJsonAPICollection.prototype.several = several;
    AngularJsonAPICollection.prototype.remove = remove;

    AngularJsonAPICollection.prototype.__prepare = __prepare;

    return AngularJsonAPICollection;

    function AngularJsonAPICollection(schema, synchronizations, linkGetters) {
      var _this = this;

      _this.Model = JsonAPIModelFactory.model(
        schema,
        synchronizations,
        linkGetters,
      _this);

      _this.data = {};
      _this.removed = {};

      _this.__prepare();
    }

    function add(data) {
      var _this = this;

      if (_this.data[data.id] === undefined) {
        _this.data[data.id] = new this.Model(data);
      } else {
        $log.error('Model with id already exists!', data.id);
      }

      return _this.data[data.id];
    }

    function __prepare() {
      var _this = this;

      var fresh = new _this.Model({
        type: _this.Model.prototype.schema.type
      });
      _this.fresh = fresh;

      $rootScope.$watch(function() {
        return fresh.pristine;
      }, function(pristine) {

        if (pristine === false) {
          var id = uuid4.generate();
          _this.data[id] = angular.copy(fresh);
          _this.data[id].data.id = id;
          _this.data[id].form.save();
          fresh.form.reset();
          fresh.pristine = true;
        }

      });

      return _this.fresh;
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
  }
})();
