(function() {
  'use strict';

  angular.module('angularJsonapi')
  .factory('AngularJsonAPIAbstractData', AngularJsonAPIAbstractDataWrapper);

  function AngularJsonAPIAbstractDataWrapper($q, $rootScope, $log, uuid4, AngularJsonAPIAbstractDataForm, lazyProperty) {

    AngularJsonAPIAbstractData.prototype.__setData = __setData;
    AngularJsonAPIAbstractData.prototype.__setLinks   = __setLinks;
    AngularJsonAPIAbstractData.prototype.__setLink = __setLink;
    AngularJsonAPIAbstractData.prototype.__validateData = __validateData;
    AngularJsonAPIAbstractData.prototype.__validateField = __validateField;
    AngularJsonAPIAbstractData.prototype.__synchronize = __synchronize;
    AngularJsonAPIAbstractData.prototype.__update = __update;

    AngularJsonAPIAbstractData.prototype.refresh = refresh;
    AngularJsonAPIAbstractData.prototype.remove = remove;

    AngularJsonAPIAbstractData.prototype.serialize = serialize;

    return AngularJsonAPIAbstractData;

    function AngularJsonAPIAbstractData(schema, linkedCollections, data) {
      var _this = this;

      _this.data = {};
      _this.links = {};
      _this.errors = {
        validation: {}
      };

      _this.dummy = data.id === undefined;

      _this.__setData(schema, data);
      _this.__setLinks(schema, linkedCollections, data.links);
      _this.form = new AngularJsonAPIAbstractDataForm(_this);
    }

    function refresh(synchronizationHooks) {
      var _this = this;

      _this.__synchronize('refresh', synchronizationHooks);
    }

    function serialize() {
      var _this = this;

      return {
        data:angular.toJson(_this.data)
      };
    }

    function remove(parentCollection, synchronizationHooks) {
      var _this = this;

      parentCollection.remove(_this.data.id);

      _this.__synchronize('remove', synchronizationHooks);
    }

    function __update(schema, synchronizationHooks, validatedData) {
      var _this = this;

      if (validatedData.id) {
        $log.error('Cannot change id of ', _this);
        delete validatedData.id;
      }

      if (validatedData.type) {
        $log.error('Cannot change type of ', _this);
        delete validatedData.type;
      }

      _this.__setData(schema, validatedData);
      _this.__synchronize('update', synchronizationHooks);
    }

    function __setLink(linkedCollections, linkAttributes, key, type) {
      var _this = this;

      if (type === 'hasMany' && angular.isArray(linkAttributes)) {
        var getAll = function() {
          var result = {};
          angular.forEach(linkAttributes, function(link) {
            result[link.id] = (_this.linkedCollections[link.type].get(link.id));
          });

          return result;
        };

        lazyProperty(_this.links, key, getAll);
      } else if (type === 'hasOne' && linkAttributes.id) {
        var getSingle = function() {
          return linkedCollections[linkAttributes.type].get(linkAttributes.id);
        };

        lazyProperty(_this.links, key, getSingle);
      }
    }

    function __setLinks(schema, linkedCollections, links) {
      var _this = this;

      angular.forEach(schema.links, function(typeObj, key) {
        if (links !== undefined && links[key] !== undefined) {
          _this.__setLink(linkedCollections, links[key].linkage, key, typeObj);
        }
      });
    }

    function __validateField(schema, data, key) {
      var error = [];

      if (key !== 'links' && key !== 'type' && data !== undefined) {
        error = __validate(schema[key], data, key);
      }

      return error;
    }

    function __validateData(schema, data) {
      var _this = this;
      var errors = {};

      angular.forEach(schema, function(validator, key) {
        var error = _this.__validateField(schema, data[key], key);
        if (error.length > 0) {
          errors[key] = error;
          $log.warn('Erorrs when validating ', data[key], errors);
        }
      });

      return errors;
    }

    function __setData(schema, data) {
      var _this = this;
      var safeData = angular.copy(data);
      _this.errors.validation = _this.__validateData(schema, data);

      angular.forEach(schema, function(validator, key) {
        if (data[key]) {
          _this.data[key] = safeData[key];
        }
      });
    }

    // todo refactor, enable arrays of validators and validators as objects like {maxlength: 3}
    function __validate(validator, value, key) {
      var errors = [];
      if (angular.isArray(validator)) {
        angular.forEach(validator, function(element) {
          errors = errors.concat(__validate(element, value, key));
        });
      } else if (angular.isFunction(validator)) {
        var err = validator(value);
        if (angular.isArray(err)) {
          errors.concat(err);
        } else {
          $log.error(
            'Wrong validator type it should return array of errors instead of: ' +
              err.toString()
          );
        }
      } else if (angular.isString(validator)) {
        if (validator === 'text' || validator === 'string') {
          if (!angular.isString(value)) {
            errors.push(key + ' is not a string ');
          }
        } else if (validator === 'number' || validator === 'integer') {
          if (parseInt(value).toString() !== value.toString()) {
            errors.push(key + ' is not a number');
          }
        } else if (validator === 'uuid4') {
          if (!uuid4.validate(value)) {
            errors.push(key + ' is not a uuid4');
          }
        } else if (validator === 'required') {
          if (value.toString().length === 0) {
            errors.push(key + ' is empty');
          }
        } else {
          $log.error('Wrong validator type: ' + validator.toString());
        }
      } else {
        $log.error('Wrong validator type: ' + validator.toString());
      }

      return errors;
    }

    function __synchronize(key, synchronizationHooks) {
      $log.log('Synchro', key, synchronizationHooks);
    }

  }
})();
