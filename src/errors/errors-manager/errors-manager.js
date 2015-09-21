(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModelErrorsManager', AngularJsonAPIModelErrorsManagerWrapper);

  function AngularJsonAPIModelErrorsManagerWrapper() {
    ErrorsManager.prototype.constructor = ErrorsManager;
    ErrorsManager.prototype.clear = clear;
    ErrorsManager.prototype.add = add;
    ErrorsManager.prototype.hasErrors = hasErrors;

    return ErrorsManager;

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

    function add(key) {
      var _this = this;

      _this.errors[key] = _this.errors[key] || [];
      _this.errors[key].push(new (_this.ErrorConstructor.bind.apply(_this.ErrorConstructor, arguments))());
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
