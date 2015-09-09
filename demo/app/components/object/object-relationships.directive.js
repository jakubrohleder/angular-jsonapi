(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .directive('angularJsonapiObjectRelationships', objectRelationships);

  function objectRelationships(RecursionHelper, AngularJsonAPIModelForm) {
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
      $scope.form = $scope.object instanceof AngularJsonAPIModelForm;

      function emptyRelationship(relationship) {
        return relationship === undefined ||
          relationship === null ||
          angular.isArray(relationship) &&
          relationship.length === 0;
      }
    }
  }

})();
