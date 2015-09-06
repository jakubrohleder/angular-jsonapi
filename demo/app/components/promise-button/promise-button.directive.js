(function() {
  'use strict';

  angular.module('promise-button')
    .directive('promiseButton', promiseButton);

  function promiseButton($parse, $q) {
    return {
      restrict: 'A',
      priority: -1,
      compile: compile
    };

    function compile($element, attr) {
      var loadingClass = attr.loadingClass || 'loading';
      var errorClass = attr.errorClass || 'negative';
      var successClass = attr.successClass || 'positive';

      var fn = $parse(attr.ngClick, null,  true);
      return function ngEventHandler(scope, element) {
        element.on('click', onClick);

        function onClick(event) {
          event.preventDefault();
          event.stopImmediatePropagation();
          element.off('click');

          var callback = function() {
            element.addClass(loadingClass);
            element.removeClass(errorClass);
            element.removeClass(successClass);
            fn(scope, {$event:event}).then(resolve, reject);
          };

          function resolve() {
            element.removeClass(loadingClass);
            element.addClass(successClass);
            element.on('click', onClick);

            return $q.resolve.apply(this, arguments);
          }

          function reject() {
            element.removeClass(loadingClass);
            element.addClass(errorClass);
            element.on('click', onClick);

            return $q.reject.apply(this, arguments);
          }

          scope.$apply(callback);
        }
      };
    }
  }
})();
