(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .filter('angularJsonapiSearchObject', searchFilter);

  function searchFilter($jsonapi) {
    var names = $jsonapi.factoriesNames();

    return function(items, search) {
      if (!search) {
        return [];
      }

      var results = [];
      var words = search.split(' ');
      var searchWord;

      if (words.length > 1) {
        searchWord = words.splice(1).join(' ');
        angular.forEach(items, function(value) {
          if (value.toString().toLowerCase().indexOf(searchWord.toLowerCase()) > -1) {
            console.log(value.toString(), searchWord);
            results.push(value);
          }
        });
      } else if (names.indexOf(words[0]) > -1) {
        return items;
      }

      return results;
    };
  }

})();
