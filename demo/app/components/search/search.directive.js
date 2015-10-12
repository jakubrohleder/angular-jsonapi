(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .directive('angularJsonapiSearch', search);

  function search() {
    return {
      restrict: 'E',
      template: '<div ng-include="contentUrl"></div>',
      controller: controller,
      link: link,
      scope: {
        object: '=',
        key: '='
      }
    };

    function link(scope) {
      if (scope.schema.polymorphic === true) {
        scope.contentUrl = 'app/components/search/search-polymorphic.html';
      } else {
        scope.contentUrl = 'app/components/search/search.html';
      }
    }

    function controller($scope, $jsonapi, $timeout) {
      $scope.schema = $scope.object.schema.relationships[$scope.key];
      if ($scope.schema.polymorphic) {
        $scope.collections = {};
        angular.forEach($jsonapi.allResources(), function(resource, resourceName) {
          $scope.collections[resourceName] = resource.cache.index();
        });
      } else {
        $scope.model = $scope.schema.model;
        $scope.collection = $jsonapi.getResource($scope.model).cache.index();
      }

      $scope.show = false;
      $scope.isEmpty = isEmpty;
      $scope.addLink = addLink;
      $scope.showResults = showResults;
      $scope.hideResults = hideResults;
      $scope.setInput = setInput;
      $scope.getIndex = getIndex;

      function isEmpty(obj) {
        return Object.keys(obj).length === 0;
      }

      function addLink(target) {
        $scope.loading = true;
        $scope.object.link($scope.key, target).then(resolve, reject);
        $scope.show = false;

        function resolve() {
          $scope.loading = false;
          $scope.input = '';
        }

        function reject(error) {
          $scope.loading = false;
          $scope.error = true;
          $scope.errorText = error[0].statusText;
        }
      }

      function showResults() {
        $scope.error = false;
        $scope.show = true;
      }

      function hideResults() {
        $scope.show = false;
      }

      function setInput(value) {
        $scope.input = value;
      }

      function getIndex(modelName) {
        $timeout(function() {
          $scope.collection = $jsonapi.getResource(modelName).all().data;
        });
      }
    }
  }

})();
