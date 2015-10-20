(function() {
  'use strict';

  angular.module('angular-jsonapi-local')
  .config(provide);

  function provide($provide) {
    $provide.decorator('$jsonapi', decorator);
  }

  function decorator($delegate, AngularJsonAPISourceLocal) {
    var $jsonapi = $delegate;

    $jsonapi.sourceLocal = AngularJsonAPISourceLocal;

    return $jsonapi;
  }
})();
