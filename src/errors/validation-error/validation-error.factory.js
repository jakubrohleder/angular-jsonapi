(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModelValidationError', AngularJsonAPIModelValidationErrorWrapper);

  function AngularJsonAPIModelValidationErrorWrapper() {
    ValidationError.prototype = Object.create(Error.prototype);
    ValidationError.prototype.constructor = ValidationError;
    ValidationError.prototype.name = 'ValidationError';

    return {
      create: ValidationErrorFactory
    };

    function ValidationErrorFactory(message, attribute) {
      return new ValidationError(message, attribute);
    }

    function ValidationError(message, attribute) {
      var _this = this;

      _this.message = message;
      _this.context = {
        attribute: attribute
      };
    }
  }
})();
