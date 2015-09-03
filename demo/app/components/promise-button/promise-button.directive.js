(function() {
  'use strict';

  angular.module('promise-button')
    .directive('promiseButton', promiseButton);

  function promiseButton() {
    return {
      restrict: 'A',
      scope: {
        ngClick: '=',
        loadingClass: '&',
        errorClass: '&',
        successClass: '&',
        errorMsg: '&',
        successMsg: '&'
      },
      link: link,
      controller: controller
    };

    function link(scope, elem) {
      elem.bind('click', function(e) {
        e.preventDefault();
        console.log('prevented')
        return false;
      });
    }

    function controller() {
      // body...
    }
  }

})();
