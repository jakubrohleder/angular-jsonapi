(function() {
  'use strict';

  angular.module('angularJsonapiExample')
  /* global _: false, Favico: false */
    .constant('_', _)
    .constant('apiURL', 'http://localhost:3000')
    .constant('Favico', Favico);
})();
