(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('$$AngularJsonAPIAbstractData', AngularJsonAPIAbstractDataFactory);

  function AngularJsonAPIAbstractDataFactory($q, $rootScope, $injector){
    return AngularJsonAPIAbstractData;


    function AngularJsonAPIAbstractData(data){
      var self = this;
      self.data = {};
      self.links = {};
      self.setData(data);
      self.setLinks();
      self.errors = {
        validation: {}
      };
      self.linksWatch = $rootScope.$watch(
        function(){return self.links;},
        setLinks.bind(self),
        true
      );
    }
    AngularJsonAPIAbstractData.prototype.refresh = refresh;
    AngularJsonAPIAbstractData.prototype.save = save;
    AngularJsonAPIAbstractData.prototype.remove = remove;
    AngularJsonAPIAbstractData.prototype.validateForm = validateForm;
    AngularJsonAPIAbstractData.prototype.validateField = validateField;
    AngularJsonAPIAbstractData.prototype.serialize = serialize;


    function serialize(){
      var self = this;
      return angular.toJson(self.data);
    }
    function setLinks (links) {
      var self = this, $jsonapi = $injector.get('$jsonapi');
      angular.forEach(self.schema.links, function(type, key){
        if(type === 'hasMany' && angular.isArray(links[key])){
          var ids = [];
          angular.forEach(links[key], function(link){
            ids.push(link.id);
          });
          self.links = $jsonapi.several(self.schema.type,ids);
        } else if (type === 'hasOne' && angular.isObject(links[key]) && !angular.isArray(links[key])) {

        }
      });
    }
    function setData () {

    }
    function refresh () {
      var self = this,
        defered = $q.defer();

      $rootScope.$broadcast('angular-jsonapi:refresh', self);

      return defered.promise();
    }
    function save () {
      var self = this,
        defered = $q.defer();
      self.validateForm();

      $rootScope.$broadcast('angular-jsonapi:save', self);

      return defered.promise();
    }
    function remove () {
      var self = this,
        defered = $q.defer();

      delete self.collection.data[self.id];
      self.collection.removed[self.id] = self;

      $rootScope.$broadcast('angular-jsonapi:remove', self);

      return defered.promise();
    }

    // TODO make it better
    function validateField(key, value){
      var self = this;
      var validation = self.schema[key];

      // Clear errors for key
      if(self.errors.validation[key] === undefined){
        self.errors.validation[key] = [];
      } else {
        self.errors.validation[key].length = 0;
      }

      if (self.schema === undefined || self.schema[key] === undefined){
        console.error('No validation schema for ' + key);
        self.errors.validation[key].push('No validation schema for ' + key);
      }
      else if(key === 'id' && key === 'type' && key === 'links'){
        console.error('Can\'t validate ' + key);
      }
      else if(angular.isFunction(validation)){
        var errors = validation(value);
        if(angular.isArray(errors)){
          self.errors.validation.concat(errors);
        } else {
          console.error(
            'Wrong validation type it should return array of errors instead of: ' +
              errors.validation.toString()
          );
        }
      } else if(angular.isString(validation)){
        if (validation === 'text') {
          if(!angular.isString(value)){
            self.errors.validation[key].push(key + ' is not a string', value);
          }
        } else if (validation === 'number') {
          if(!angular.isNumber(value)){
            self.errors.validation[key].push(key + ' is not a number', value);
          }
        } else {
          console.error('Wrong validation type: ' + validation.toString());
        }
      } else {
        console.error('Wrong validation type: ' + validation.toString());
      }
      return self.errors.validation[key];
    }
    function validateForm(){
      var self = this;
      self.valid = true;
      if(self.schema === undefined) {
        console.error('Schema not defined', self);
      }
      angular.forEach(self.schema, function(validation, key){
        if(key !== 'id' && key !== 'type' && key !== 'links'){
          self.valid = self.valid && self.validateField(key, self.form[key]);
        }
      });
    }
  }
})();