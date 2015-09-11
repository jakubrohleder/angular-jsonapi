/*jshint expr: true*/
(function() {
  'use strict';

  describe('$jsonapi', function() {

    beforeEach(module('angular-jsonapi'));

    it('returns valid model', inject(function($jsonapi) {
      expect($jsonapi).toBeDefined();
    }));
  });
})();
