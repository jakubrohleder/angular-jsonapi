(function() {
  'use strict';

  angular.module('angularJsonapiExample')
    .directive('angularJsonapiSearch', search);

  function search() {
    return {
      restrict: 'E',
      templateUrl: 'app/components/search/search.html',
      controller: controller,
      scope: {
        object: '=',
        key: '='
      }
    };

    function controller($scope, $jsonapi) {
      $scope.collections = {};
      angular.forEach($jsonapi.allFactories(), function(factory, factoryName) {
        $scope.collections[factoryName] = factory.cache.index();
      });

      $scope.show = false;
      $scope.isEmpty = isEmpty;
      $scope.addLink = addLink;
      $scope.showResults = showResults;
      $scope.hideResults = hideResults;
      $scope.setInput = setInput;

      function isEmpty(obj) {
        return Object.keys(obj).length === 0;
      }

      function addLink(target) {
        console.log(target);
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
    }
  }

})();
