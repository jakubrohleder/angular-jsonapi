(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModelForm', AngularJsonAPIModelFormWrapper);

  function AngularJsonAPIModelFormWrapper(
    AngularJsonAPIModelValidatorService,
    AngularJsonAPIModelLinkerService
  ) {

    AngularJsonAPIModelForm.prototype.save = save;
    AngularJsonAPIModelForm.prototype.reset = reset;
    AngularJsonAPIModelForm.prototype.validate = validate;
    AngularJsonAPIModelForm.prototype.validateField = validateField;

    AngularJsonAPIModelForm.prototype.link = link;
    AngularJsonAPIModelForm.prototype.unlink = unlink;

    AngularJsonAPIModelForm.prototype.toJson = toJson;

    return AngularJsonAPIModelForm;

    function AngularJsonAPIModelForm(parent) {
      var _this = this;

      _this.data = {
        id: parent.data.id,
        type: parent.data.type,
        attributes: {},
        relationships: {}
      };

      _this.relationships = {};
      _this.parent = parent;
      _this.schema = parent.schema;
      _this.reset();
    }

    /**
     * Encodes object into json
     * @return {json} Json object
     */
    function toJson() {
      var _this = this;
      var data = angular.copy(_this.data);
      var relationships = {};

      angular.forEach(data.relationships, function(value, key) {
        if (value.data !== undefined) {
          relationships[key] = value;
        }
      });

      data.relationships = relationships;

      return {
        data: data
      };
    }

    /**
     * Saves form, shortcut to parent.save()
     * @return {promise} Promise associated with synchronization
     */
    function save() {
      var _this = this;

      return _this.parent.save();
    }

    /**
     * Resets form to state of a parent
     * @return {undefined}
     */
    function reset() {
      var _this = this;

      angular.forEach(_this.schema.attributes, function(validator, key) {
        _this.data.attributes[key] = _this.parent.data.attributes[key] || '';
      });

      angular.forEach(_this.schema.relationships, function(data, key) {
        _this.data.relationships[key] = _this.parent.data.relationships[key] || {};
        _this.relationships[key] = _this.parent.relationships[key];
      });

      _this.errors = {
        validation: {}
      };
    }

    /**
     * Validates form
     * @return {objec} Errors object indexed by keys
     */
    function validate() {
      var _this = this;
      var errors;

      errors = AngularJsonAPIModelValidatorService.validateForm(_this.data);

      _this.errors.validation = errors;

      return errors;
    }

    /**
     * Validates single field
     * @param  {string} key Field key
     * @return {array}     Errors array
     */
    function validateField(key) {
      var _this = this;
      var errors;
      errors = AngularJsonAPIModelValidatorService.validateField(
        _this.data[key],
        key
      );

      _this.errors.validation[key] = errors;

      return errors;
    }

    /**
     * Adds link to a form without synchronization
     * @param {string} key    Relationship name
     * @param {AngularJsonAPIModel} target Object to be linked
     * @return {Boolean}        Status
     */
    function link(key, target) {
      var _this = this;
      var schema = _this.schema.relationships[key];

      return AngularJsonAPIModelLinkerService.link(_this, key, target, schema);
    }

    /**
     * Removes link from form without synchronization
     * @param  {[type]} key    Relationship name
     * @param {AngularJsonAPIModel} target Object to be linked
     * @return {Boolean}        Status
     */
    function unlink(key, target) {
      var _this = this;
      var schema = _this.schema.relationships[key];

      return AngularJsonAPIModelLinkerService.unlink(_this, key, target, schema);
    }
  }
})();
