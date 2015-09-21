(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModelValidationErrors', AngularJsonAPIModelValidationErrorsWrapper);

  function AngularJsonAPIModelValidationErrorsWrapper() {
    ValidationErrors.prototype = Object.create(Error.prototype);
    ValidationErrors.prototype.constructor = ValidationErrors;

    return ValidationErrors;

    function ValidationErrors(errors, options, attributes, constraints) {
      Error.captureStackTrace(this, this.constructor);
      this.errors = errors;
      this.options = options;
      this.attributes = attributes;
      this.constraints = constraints;
    }
  }
})();
