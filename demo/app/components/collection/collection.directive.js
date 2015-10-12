(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .directive('angularJsonapiCollection', collection);

  function collection(RecursionHelper, $jsonapi) {
    return {
      restrict: 'E',
      templateUrl: 'app/components/collection/collection.html',
      scope: {
        collection: '=data'
      },
      compile: RecursionHelper.compile,
      controller: function($scope, $interval, AngularJsonAPISourceRest, $location, $state) {
        $interval(function() {
          $scope.updateDiff = (Date.now() - $scope.collection.updatedAt) / 1000;
        }, 100);

        $scope.objectKeys = objectKeys;

        $scope.newObjects = [];
        $scope.filters = $scope.collection.params.filter || {};
        var params = AngularJsonAPISourceRest.encodeParams({filter: $scope.filters});
        $location.search(params);

        $scope.close = close;
        $scope.clear = clear;
        $scope.add = add;
        $scope.addFilter = addFilter;
        $scope.removeFilter = removeFilter;
        $scope.filterKey = undefined;
        $scope.filter = filter;
        $scope.clearFilter = clearFilter;

        function close() {
          $scope.$broadcast('close');
        }

        function clear() {
          $jsonapi.clearCache();
        }

        function add() {
          $scope.newObjects.push($scope.collection.resource.initialize());
        }

        function addFilter(filterKey) {
          $scope.filters[filterKey] = null;
        }

        function removeFilter(filterKey) {
          delete $scope.filters[filterKey];
        }

        function filter() {
          var params = AngularJsonAPISourceRest.encodeParams({filter: $scope.filters});
          $location.search(params);
          $state.reload();
        }

        function clearFilter() {
          $location.search({});
          $state.reload();
        }

        function objectKeys(object) {
          if (angular.isObject(object)) {
            return Object.keys(object).length;
          } else {
            return 0;
          }
        }
      }
    };
  }

})();
