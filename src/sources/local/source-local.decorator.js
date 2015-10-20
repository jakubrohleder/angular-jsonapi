(function() {
  'use strict';

  angular.module('angular-jsonapi-local')
  .decorator('$jsonapi', decorator);

  function decorator($delegate, AngularJsonAPISourceLocal) {
    var $jsonapi = $delegate;

    $jsonapi.sourceLocal = AngularJsonAPISourceLocal;

    return $jsonapi;
  }
})();
