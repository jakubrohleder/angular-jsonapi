(function() {
  'use strict';

  /* global Parse: false */
  angular.module('angular-jsonapi-parse', ['angular-jsonapi'])
    .constant('Parse', Parse);
})();
