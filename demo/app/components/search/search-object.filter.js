(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .filter('angularJsonapiSearchObject', searchFilter);

  function searchFilter($jsonapi) {
    var names = $jsonapi.listResources();

    return function(items, search, relationship, polymorphic) {
      if(items === undefined) {
        return;
      }

      if (!search) {
        if (polymorphic === true) {
          return [];
        } else if (angular.isArray(relationship)) {
          return items.filter(function(value) {
            return relationship.indexOf(value) === -1;
          });
        } else {
          return items;
        }
      }

      var results = [];
      var words = search.split(' ');
      var searchWord;

      if (polymorphic === false) {
        searchWord = search;
        angular.forEach(items, function(value) {
          if (relationship.indexOf(value) === -1 && value.toString().toLowerCase().indexOf(searchWord.toLowerCase()) > -1) {
            results.push(value);
          }
        });
      } else {
        if (words.length > 1) {
          searchWord = words.splice(1).join(' ');
          angular.forEach(items, function(value) {
            if (relationship.indexOf(value) === -1 && value.toString().toLowerCase().indexOf(searchWord.toLowerCase()) > -1) {
              results.push(value);
            }
          });
        } else if (names.indexOf(words[0]) > -1) {
          if (angular.isArray(relationship)) {
            return items.filter(function(value) {
              return relationship.indexOf(value) === -1;
            });
          } else {
            return items.filter(function(value) {
              return relationship !== value;
            });
          }
        }
      }

      return results;
    };
  }

})();
