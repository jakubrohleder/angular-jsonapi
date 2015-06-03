(function() {
  'use strict';

  angular.module('angular-jsonapi', ['uuid4'])
  /* global pluralize: false */
  .constant('pluralize', pluralize);
})();
