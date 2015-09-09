(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModelForm', AngularJsonAPIModelFormWrapper);

  function AngularJsonAPIModelFormWrapper(
    AngularJsonAPIModelValidatorService,
    AngularJsonAPIModelLinkerService,
    $q
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
    function reset(auto) {
      var _this = this;

      if (auto === true && _this.parent.synchronized === true) {
        return;
      }

      angular.forEach(_this.schema.attributes, function(validator, key) {
        _this.data.attributes[key] = angular.copy(_this.parent.data.attributes[key]) || '';
      });

      angular.forEach(_this.schema.relationships, function(data, key) {
        _this.data.relationships[key] = angular.copy(_this.parent.data.relationships[key]) || {};
        if (angular.isArray(_this.relationships[key])) {
          _this.relationships[key] = _this.parent.relationships[key].slice();
        } else {
          _this.relationships[key] = _this.parent.relationships[key];
        }
      });

      _this.errors = {
        validation: {}
      };
    }

    /**
     * Validates form
     * @return {promise} Promise rejected to errors object indexed by keys
     */
    function validate() {
      var _this = this;
      var deferred = $q.defer();

      AngularJsonAPIModelValidatorService.validateForm(_this.data).then(deferred.resolve, reject);

      function reject(erorrs) {
        _this.errors.validation = erorrs;

        deferred.reject(erorrs);
      }

      return deferred.promise;
    }

    /**
     * Validates single field
     * @param  {string} key Field key
     * @return {promise} Promise rejected to errors array
     */
    function validateField(key) {
      var _this = this;
      var deferred = $q.defer();

      AngularJsonAPIModelValidatorService.validateForm(_this.data[key], key).then(deferred.resolve, reject);

      function reject(erorrs) {
        _this.errors.validation[key] = erorrs;

        deferred.reject(erorrs);
      }

      return deferred.promise;
    }

    /**
     * Adds link to a form without synchronization
     * @param {string} key    Relationship name
     * @param {AngularJsonAPIModel} target Object to be linked
     * @return {Boolean}        Status
     */
    function link(key, target) {
      var _this = this;

      return $q.resolve(AngularJsonAPIModelLinkerService.link(_this, key, target, true));
    }

    /**
     * Removes link from form without synchronization
     * @param  {[type]} key    Relationship name
     * @param {AngularJsonAPIModel} target Object to be linked
     * @return {Boolean}        Status
     */
    function unlink(key, target) {
      var _this = this;

      return $q.resolve(AngularJsonAPIModelLinkerService.unlink(_this, key, target, true));
    }
  }
})();
