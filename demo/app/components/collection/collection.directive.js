(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .directive('angularJsonapiCollection', collection);

  function collection(RecursionHelper) {
    return {
      restrict: 'E',
      templateUrl: 'app/components/collection/collection.html',
      scope: {
        collection: '=data'
      },
      compile: RecursionHelper.compile,
      controller: function($scope, $interval, $jsonapi, $location, $state) {
        $interval(function() {
          $scope.updateDiff = (Date.now() - $scope.collection.updatedAt) / 1000;
        }, 100);

        $scope.objectKeys = objectKeys;

        $scope.newObjects = [];

        var filters = $scope.collection.params.filter || {};
        var params = $jsonapi.sourceRest.encodeParams({filter: filters});
        $location.search(params);

        $scope.close = close;
        $scope.clear = clear;

        $scope.add = add;

        $scope.filter = filter;
        $scope.addFilter = addFilter;
        $scope.removeFilter = removeFilter;
        $scope.clearFilter = clearFilter;
        $scope.filtersArray = [];

        angular.forEach($scope.collection.params.filter, function(filter, filterKey) {
          angular.forEach(filter, function(filterValue) {
            addFilter(filterKey, filterValue);
          });
        });

        function close() {
          $scope.$broadcast('close');
        }

        function clear() {
          $jsonapi.clearCache();
        }

        function add() {
          $scope.newObjects.push($scope.collection.resource.initialize());
        }

        function addFilter(filterKey, filterValue) {
          $scope.filtersArray.push({key: filterKey, value: filterValue});
        }

        function removeFilter(index) {
          $scope.filtersArray.splice(index, 1);
        }

        function filter() {
          var filters = {};

          angular.forEach($scope.filtersArray, function(filter) {
            filters[filter.key] = filters[filter.key] || [];
            filters[filter.key].push(filter.value);
          });

          $location.search($jsonapi.sourceRest.encodeParams({filter: filters}));
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
