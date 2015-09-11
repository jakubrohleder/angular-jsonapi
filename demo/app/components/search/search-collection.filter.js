(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .filter('angularJsonapiSearchCollection', searchFilter);

  function searchFilter() {
    return function(items, search) {
      if (!search) {
        return items;
      }

      var results = {};
      var words = search.split(' ');
      angular.forEach(items, function(value, key) {
        if (key.indexOf(words[0]) > -1) {
          results[key] = value;
        }
      });

      return results;
    };
  }

})();
