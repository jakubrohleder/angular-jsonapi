(function() {
  'use strict';

  angular.module('angular-jsonapi-parse')
  .config(provide);

  function provide($provide) {
    $provide.decorator('$jsonapi', decorator);
  }

  function decorator($delegate, AngularJsonAPISourceParse) {
    var $jsonapi = $delegate;

    $jsonapi.sourceLocal = AngularJsonAPISourceParse;

    return $jsonapi;
  }
})();
