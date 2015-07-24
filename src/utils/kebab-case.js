(function() {
  'use strict';

  angular.module('angular-jsonapi')
    .constant('toKebabCase', function(str) {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    });

})();
