(function() {
  'use strict';

  angular.module('angular-jsonapi')
    .constant('namedFunction', namedFunction);

  function namedFunction(name, fn) {
    return new Function('fn',
      'return function ' + name + '(){ return fn.apply(this,arguments)}'
    )(fn);
  }
})();
