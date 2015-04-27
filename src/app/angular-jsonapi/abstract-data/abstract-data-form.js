(function() {
  'use strict';

  angular.module('angularJsonapi')
  .factory('AngularJsonAPIAbstractDataForm', AngularJsonAPIAbstractDataFormWrapper);

  function AngularJsonAPIAbstractDataFormWrapper($log) {

    AngularJsonAPIAbstractDataForm.prototype.save = save;
    AngularJsonAPIAbstractDataForm.prototype.reset = reset;
    AngularJsonAPIAbstractDataForm.prototype.validate = validate;
    AngularJsonAPIAbstractDataForm.prototype.validateField = validateField;

    return AngularJsonAPIAbstractDataForm;

    function AngularJsonAPIAbstractDataForm(parent) {
      var _this = this;

      _this.data = {};
      _this.parent = parent;
      _this.reset();
    }

    function save() {
      var _this = this;
      var promise = _this.parent.__update(_this.data);

      promise.catch(function(errors) {
        _this.errors.validation = errors.validation;
      });

      return promise;
    }

    function reset() {
      var _this = this;

      angular.forEach(_this.parent.data, function(data, key) {
        _this.data[key] = _this.parent.data[key];
      });

      angular.forEach(_this.data, function(data, key) {
        if (_this.parent.data[key]) {
          _this.data[key] = _this.parent.data[key];
        } else {
          delete _this.data[key];
        }
      });

      delete (_this.data).id;
      delete (_this.data).type;

      _this.errors = {
        validation: {}
      };
    }

    function validate() {
      var _this = this;
      var errors;

      errors = _this.parent.__validateData(
        this.parent.schema,
        _this.data
      );

      _this.errors.validation = errors;

      return errors;
    }

    function validateField(key) {
      var _this = this;
      var errors;
      $log.debug('Validating: ', _this.data[key], key);
      errors = _this.parent.__validateField(
        this.parent.schema,
        _this.data[key],
        key
      );

      $log.debug('Erorrs: ', errors);

      _this.errors.validation[key] = errors;

      return errors;
    }

  }
})();
