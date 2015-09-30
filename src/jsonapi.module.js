(function() {
  'use strict';

  angular.module('angular-jsonapi', ['uuid4'])
  /* global pluralize: false, validate: false */
  .constant('pluralize', pluralize)
  .constant('validateJS', validate);
})();
