(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModelValidationError', AngularJsonAPIModelValidationErrorWrapper);

  function AngularJsonAPIModelValidationErrorWrapper() {
    ValidationError.prototype = Object.create(Error.prototype);
    ValidationError.prototype.constructor = ValidationError;
    ValidationError.prototype.name = 'ValidationError';

    return ValidationError;

    function ValidationError(message, attribute) {
      var _this = this;
      Error.captureStackTrace(_this, _this.constructor);

      _this.message = message;
      _this.context = {
        attribute: attribute
      };
    }
  }
})();
