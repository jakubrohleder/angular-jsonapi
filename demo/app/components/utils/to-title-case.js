(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .constant('toTitleCase', toTitleCase)
    .filter('toTitleCase', toTitleCaseFilter);

  function toTitleCase(string) {
    var out = string.replace(/^\s*/, '');  // strip leading spaces
    out = out.replace(/^[a-z]|[^\s][A-Z]/g, function(str, offset) {
      if (offset === 0) {
        return str.toUpperCase();
      } else {
        return str.substr(0, 1) + ' ' + str.substr(1).toUpperCase();
      }
    });

    return out;
  }

  function toTitleCaseFilter() {
    return function(input) {
      return toTitleCase(input);
    };
  }
})();
