(function() {
  'use strict';

  angular.module('angularJsonapi')
  .factory('$$AngularJsonAPICollection', AngularJsonAPICollectionFactory);

  function AngularJsonAPICollectionFactory ($rootScope, uuid4) {
    return AngularJsonAPICollection;

    function AngularJsonAPICollection(Model){
      var self = this;
      self.Model = Model;
      self.data = {};
      self.removed = {};

      $rootScope.$broadcast('angular-json:initialize', self);
    }

    AngularJsonAPICollection.prototype.add = create;
    AngularJsonAPICollection.prototype.get = get;
    AngularJsonAPICollection.prototype.all = all;
    AngularJsonAPICollection.prototype.several = several;

    function create(links, id){
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
    function get(id){
      var self = this;
      if(self.data[id] === undefined){
        self.create([], id);
      }

      $rootScope.$broadcast('angular-json:get', self.data[id]);

      return self.data[id];
    }
    function several(ids){
      var self = this, datas = [];
      angular.forEach(ids, function(id){
        if(self.data[id] === undefined){
          self.create([], id);
        }
        datas.push(self.data[id]);
      });

      $rootScope.$broadcast('angular-json:several', datas);

      return self.datas;
    }
    function all(){
      var self = this;

      $rootScope.$broadcast('angular-json:all', self);

      return this;
    }
  }
})();