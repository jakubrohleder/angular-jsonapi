(function() {
  'use strict';

  angular.module('angularJsonapi')
  .factory('$$AngularJsonAPIAbstractDataFactory', AngularJsonAPIAbstractDataFactory);

  function AngularJsonAPIAbstractDataFactory($q, $rootScope, $injector, $log, uuid4){

    return {
      model: ModelFactory
    };

    function ModelFactory(schema, linkGetters) {
      var name = schema.type.charAt(0).toUpperCase();
      var Model = function(data){
        AngularJsonAPIAbstractData.call(this, data);
      };
      Model.prototype = Object.create(AngularJsonAPIAbstractData.prototype);
      Model.prototype.constructor = Model;
      Model.prototype.schema = schema;
      Model.prototype.linkGetters = linkGetters;
      Model.prototype.factoryName = name;
      return Model;
    }


    function AngularJsonAPIAbstractData(data){
      var self = this;

      if (data.type !== self.schema.type){
        $log.error('Data type other then declared in schema: ', data.type, ' instead of ', self.schema.type);
      }

      self.data = {};
      self.links = {};
      self.errors = {
        validation: {}
      };

      self.__setData = __setData;
      self.__setAttribute = __setAttribute;
      self.__setLinks = __setLinks;
      self.__setLink = __setLink;

      if (data.id === undefined) {
        data.id = uuid4.generate();
      }
      self.__setData(data);
      self.__setLinks(data.links);
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

    // TODO refactor and improve it
    // make private helper withe validator, value args

    function validateField(key, value){
      var self = this;

      var errors = [];

      if (self.schema === undefined || self.schema[key] === undefined){
        $log.error('No validation schema for ' + key);
        errors.push('No validation schema for ' + key);
      }
      else if(key === 'id' && key === 'type' && key === 'links'){
        $log.error('Can\'t validate ' + key);
      }

      return __validate(self.schema[key], value, key);
    }

    function validateForm(){
      var self = this;
      self.valid = true;

      if(self.schema === undefined) {
        $log.error('Schema not defined', self);
      }

      angular.forEach(self.schema, function(validation, key){
        if(key !== 'id' && key !== 'type' && key !== 'links'){
          self.errors.validation[key] = self.validateField(key, self.form[key]);
          self.valid = self.valid && self.errors.validation[key] === [];
        }
      });
    }

    //
    // private
    //

    function __setLink(linkObj, key, type){
      var self = this;
      $log.log('Setting link', linkObj, key, type);
      if(type === 'hasMany' && angular.isArray(linkObj)){
        var ids = [];

        angular.forEach(linkObj, function(link){
          ids.push(link.id);
        });
        self.links[key] = self.linkGetters[key].bind(self, ids);
      } else if (type === 'hasOne' && linkObj.id) {
        self.links[key] = self.linkGetters[key].bind(self, linkObj.id);
      }
    }

    function __setLinks (links) {
      var self = this;

      angular.forEach(self.schema.links, function(type, key){
        self.__setLink(links[key].linkage, key, type);
      });
    }

    function __setAttribute (attributeObj, key, validator) {
      var self = this;
      var errors = [];
      if(key !== 'links' && key !== 'type'){
        __validate(validator, attributeObj, key);
      }

      if(errors.length > 0){
        $log.warn('Erorrs when validating ', attributeObj, errors);
      }

      self.data[key] = attributeObj;
    }

    function __setData (data) {
      var self = this;

      angular.forEach(self.schema, function(validator, key){
        self.__setAttribute(data[key], key, validator);
      });
    }

    function __validate(validator, value, key){
      var errors = [];
      if(angular.isFunction(validator)){
        var err = validator(value);
        if(angular.isArray(err)){
          errors.concat(err);
        } else {
          $log.error(
            'Wrong validation type it should return array of errors instead of: ' +
              err.toString()
          );
        }
      } else if(angular.isString(validator)){
        if (validator === 'text' || validator === 'string') {
          if(!angular.isString(value)){
            errors.push(key + ' is not a string', value);
          }
        } else if (validator === 'number') {
          if(!angular.isNumber(value)){
            errors.push(key + ' is not a number', value);
          }
        } else if (validator === 'uuid4') {
          if(!uuid4.validate(value)){
            errors.push(key + ' is not a uuid4', value);
          }
        } else {
          $log.error('Wrong validation type: ' + validator.toString());
        }
      } else {
        $log.error('Wrong validation type: ' + validator.toString());
      }
      return errors;
    }

  }
})();