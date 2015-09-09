(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .service('AngularJsonAPIModelValidatorService', AngularJsonAPIModelValidatorService);

  function AngularJsonAPIModelValidatorService(
    $q
  ) {
    var _this = this;
    _this.validateForm = validateForm;
    _this.validateField = validateField;

    return this;

    /**
     * Validates form
     * @param  {object} data Form data
     * @return {object} Errors object indexed by keys
     */
    function validateForm(schema, data) {
      var _this = this;

      return $q.resolve({});
    }

    /**
     * Validates single field
     * @param  {string} key Field key
     * @return {array}     Errors array
     */
    function validateField(schema, key) {
      var _this = this;

      return $q.resolve([]);
    }

    // function __validate(validator, attributeValue, attributeName) {
    //   var errors = [];
    //   if (angular.isArray(validator)) {
    //     angular.forEach(validator, function(element) {
    //       errors = errors.concat(__validate(element, attributeValue, attributeName));
    //     });
    //   } else if (angular.isFunction(validator)) {
    //     var err = validator(attributeValue, attributeName);
    //     if (angular.isArray(err)) {
    //       errors.concat(err);
    //     } else {
    //       $log.error(
    //         'Wrong validator type it should return array of errors instead of: ' +
    //           err.toString()
    //       );
    //     }
    //   } else if (angular.isString(validator)) {
    //     if (validator === 'text' || validator === 'string') {
    //       if (!angular.isString(attributeValue)) {
    //         errors.push(attributeName + ' is not a string ');
    //       }
    //     } else if (validator === 'number' || validator === 'integer') {
    //       if (parseInt(attributeValue).toString() !== attributeValue.toString()) {
    //         errors.push(attributeName + ' is not a number');
    //       }
    //     } else if (validator === 'uuid4') {
    //       if (!uuid4.validate(attributeValue)) {
    //         errors.push(attributeName + ' is not a uuid4');
    //       }
    //     } else if (validator === 'required') {
    //       if (attributeValue.toString().length === 0) {
    //         errors.push(attributeName + ' is empty');
    //       }
    //     } else {
    //       $log.error('Wrong validator type: ' + validator.toString());
    //     }
    //   } else if (angular.isObject(validator)) {
    //     if (validator.maxlength !== undefined && attributeValue.length > validator.maxlength) {
    //       errors.push(attributeName + ' is too long max ' + validator.maxlength);
    //     }

    //     if (validator.minlength !== undefined && attributeValue.length < validator.minlength) {
    //       errors.push(attributeName + ' is too short min ' + validator.minlength);
    //     }

    //     if (validator.maxvalue !== undefined && parseInt(attributeValue) > validator.maxvalue) {
    //       errors.push(attributeName + ' is too big max ' + validator.maxvalue);
    //     }

    //     if (validator.minvalue !== undefined && parseInt(attributeValue) < validator.minvalue) {
    //       errors.push(attributeName + ' is too small min ' + validator.minvalue);
    //     }
    //   } else {
    //     $log.error('Wrong validator type: ' + validator.toString());
    //   }

    //   return errors;
    // }
  }
})();
