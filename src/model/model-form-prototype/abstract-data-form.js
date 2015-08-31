(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIAbstractDataForm', AngularJsonAPIAbstractDataFormWrapper);

  function AngularJsonAPIAbstractDataFormWrapper($log) {

    AngularJsonAPIAbstractDataForm.prototype.save = save;
    AngularJsonAPIAbstractDataForm.prototype.reset = reset;
    AngularJsonAPIAbstractDataForm.prototype.validate = validate;
    AngularJsonAPIAbstractDataForm.prototype.validateField = validateField;

    AngularJsonAPIAbstractDataForm.prototype.__synchronize = __synchronize;

    return AngularJsonAPIAbstractDataForm;

    function AngularJsonAPIAbstractDataForm(parent) {
      var _this = this;

      _this.data = {
        attributes: {},
        relationships: {}
      };
      _this.parent = parent;
      _this.reset();
    }

    function save() {
      var _this = this;
      var errors = _this.validate();

      if (angular.equals(errors, {}) === false) {
        $log.error('Errors in form: ', errors);
        return;
      }

      _this.parent.__updateAttributes(_this.data.attributes);
    }

    function reset() {
      var _this = this;

      angular.forEach(_this.parent.schema.attributes, function(data, key) {
        _this.data.attributes[key] = _this.parent.data.attributes[key] || '';
      });

      angular.forEach(_this.parent.schema.relationships, function(data, key) {
        _this.data.relationships[key] = _this.parent.data.relationships[key] || {};
      });

      _this.errors = {
        validation: {}
      };
    }

    function validate() {
      var _this = this;
      var errors;

      errors = _this.parent.__validateData(_this.data);

      _this.errors.validation = errors;

      return errors;
    }

    function validateField(key) {
      var _this = this;
      var errors;
      errors = _this.parent.__validateField(
        _this.data[key],
        key
      );

      _this.errors.validation[key] = errors;

      return errors;
    }

    function __synchronize(key) {
      $log.log('Synchro Collection ' + this.Model.prototype.schema.type, key);
    }

  }
})();
