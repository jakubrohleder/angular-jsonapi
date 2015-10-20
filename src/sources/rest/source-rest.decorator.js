(function() {
  'use strict';

  angular.module('angular-jsonapi-rest')
  .decorator('$jsonapi', decorator);

  function decorator($delegate, AngularJsonAPISourceRest) {
    var $jsonapi = $delegate;

    $jsonapi.sourceRest = AngularJsonAPISourceRest;

    return $jsonapi;
  }
})();
