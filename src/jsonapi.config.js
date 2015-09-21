(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .config(function($logProvider) {
    $logProvider.debugEnabled(false);
  })
  .run(function(validateJS, $q) {
    validateJS.Promise = $q;
  });
})();
