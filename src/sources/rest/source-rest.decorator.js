(function() {
  'use strict';

  angular.module('angular-jsonapi-rest')
  .config(provide);

  function provide($provide) {
    $provide.decorator('$jsonapi', decorator);
  }

  function decorator($delegate, AngularJsonAPISourceRest) {
    var $jsonapi = $delegate;

    $jsonapi.sourceRest = AngularJsonAPISourceRest;

    return $jsonapi;
  }
})();
