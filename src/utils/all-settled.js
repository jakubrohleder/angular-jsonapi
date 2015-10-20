(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .config(provide);

  function provide($provide) {
    $provide.decorator('$q', decorator);
  }

  function decorator($delegate) {
    var $q = $delegate;

    $q.allSettled = $q.allSettled || allSettled;

    function allSettled(promises, resolvedCallback, rejectedCallback) {
      // Implementation of allSettled function from Kris Kowal's Q:
      // https://github.com/kriskowal/q/wiki/API-Reference#promiseallsettled
      // by Michael Kropat from http://stackoverflow.com/a/27114615/1400432 slightly modified

      var wrapped = angular.isArray(promises) ? [] : {};

      angular.forEach(promises, function(promise, key) {
        if (!wrapped.hasOwnProperty(key)) {
          wrapped[key] = wrap(promise);
        }
      });

      return $q.all(wrapped);

      function wrap(promise) {
        return $q.resolve(promise)
          .then(function(value) {
            if (angular.isFunction(resolvedCallback)) {
              resolvedCallback(value);
            }

            return { success: true, value: value };
          },

          function(reason) {
            if (angular.isFunction(rejectedCallback)) {
              rejectedCallback(reason);
            }

            return { success: false, reason: reason };
          });
      }
    }

    return $q;
  }
})();
