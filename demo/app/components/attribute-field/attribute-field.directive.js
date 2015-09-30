(function() {
  'use strict';

  angular.module('promise-button')
    .directive('attributeField', attributeField);

  function attributeField() {
    return {
      restrict: 'A',
      controller: controller,
      templateUrl: 'app/components/attribute-field/attribute-field.html',
      scope: {
        object: '=',
        key: '='
      }
    };

    function controller($scope) {

    }
  }
})();
