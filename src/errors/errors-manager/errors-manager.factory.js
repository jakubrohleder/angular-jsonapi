(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModelErrorsManager', AngularJsonAPIModelErrorsManagerWrapper);

  function AngularJsonAPIModelErrorsManagerWrapper() {
    ErrorsManager.prototype.constructor = ErrorsManager;
    ErrorsManager.prototype.concat = concat;
    ErrorsManager.prototype.clear = clear;
    ErrorsManager.prototype.add = add;
    ErrorsManager.prototype.hasErrors = hasErrors;

    return {
      create: ErrorsManagerFactory
    };

    function ErrorsManagerFactory(name, description, ErrorConstructor, defaultFilter) {
      return new ErrorsManager(name, description, ErrorConstructor, defaultFilter);
    }

    function ErrorsManager(name, description, ErrorConstructor, defaultFilter) {
      var _this = this;
      _this.name = name;
      _this.description = description;

      _this.ErrorConstructor = ErrorConstructor;
      _this.errors = {};
      _this.defaultFilter = defaultFilter || function() { return true; };
    }

    function clear(key) {
      var _this = this;

      if (key === undefined) {
        angular.forEach(_this.errors, function(obj, key) {
          _this.errors[key] = [];
        });
      } else {
        _this.errors[key] = [];
      }
    }

    function add(key, error) {
      var _this = this;

      _this.errors[key] = _this.errors[key] || [];
      _this.errors[key].push(error);
    }

    function concat(errors) {
      var _this = this;

      angular.forEach(errors, function(error) {
        _this.errors[error.key] = [];
      });

      angular.forEach(errors, function(error) {
        _this.errors[error.key].push(error.object);
      });

    }

    function hasErrors(key) {
      var _this = this;

      if (key === undefined) {
        var answer = false;

        angular.forEach(_this.errors, function(error) {
          answer = answer || error.length > 0;
        });

        return answer;
      } else {
        return _this.errors[key] !== undefined && _this.errors[key].length > 0;
      }
    }
  }
})();
