(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .directive('angularJsonapiObjectRelationships', objectRelationships);

  function objectRelationships(RecursionHelper) {
    return {
      restrict: 'E',
      templateUrl: 'app/components/object/object-relationships.html',
      scope: {
        object: '=data'
      },
      compile: RecursionHelper.compile,
      controller: controller
    };

    function controller($scope) {
      $scope.isArray = angular.isArray;
      $scope.emptyRelationship = emptyRelationship;
      $scope.form = $scope.object.parent !== undefined;

      function emptyRelationship(relationship) {
        return relationship === undefined ||
          relationship === null ||
          angular.isArray(relationship) &&
          relationship.length === 0;
      }
    }
  }

})();
