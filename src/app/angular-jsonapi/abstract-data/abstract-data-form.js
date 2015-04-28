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
      var errors = _this.validate();

      if (errors !== {}) {
        $log.error('Errors in form: ', errors);
      }

      _this.parent.__update(_this.data);
    }

    function reset() {
      var _this = this;

      angular.forEach(_this.parent.schema, function(data, key) {
        _this.data[key] = _this.parent.data[key] || undefined;
      });

      delete (_this.data).id;
      delete (_this.data).type;
      delete (_this.data).links;

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
      errors = _this.parent.__validateField(
        this.parent.schema,
        _this.data[key],
        key
      );

      _this.errors.validation[key] = errors;

      return errors;
    }

  }
})();
