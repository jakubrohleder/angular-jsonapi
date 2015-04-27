(function() {
  'use strict';

  angular.module('angularJsonapi')
  .factory('$$AngularJsonAPICollection', AngularJsonAPICollectionFactory);

  function AngularJsonAPICollectionFactory($rootScope, uuid4) {
    return AngularJsonAPICollection;

    function AngularJsonAPICollection(Model) {
      var _this = this;
      _this.Model = Model;
      _this.data = {};
      _this.removed = {};

      $rootScope.$broadcast('angular-json:initialize', _this);
    }

    AngularJsonAPICollection.prototype.add = create;
    AngularJsonAPICollection.prototype.get = get;
    AngularJsonAPICollection.prototype.all = all;
    AngularJsonAPICollection.prototype.several = several;

    function create(links, id) {
      if (id === undefined) {
        id = uuid4.generate();
      }

      var model = new this.Model({
        id: id,
        links: links
      });
      this.data[model.id] = model;

      $rootScope.$broadcast('angular-json:create', model);

      return model;
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
  }
})();
