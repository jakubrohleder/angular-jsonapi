(function() {
  'use strict';

  angular.module('promise-button')
    .directive('promiseButtonLable', promiseButtonLable);

  function promiseButtonLable() {
    return {
      restrict: 'A',
      require: '^asynchronousButton',
      link: link,
      controller: controller
    };

    function link() {
      //
    }

    function controller() {
      // body...
    }
  }

})();
