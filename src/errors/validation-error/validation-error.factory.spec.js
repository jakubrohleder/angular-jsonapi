/*jshint expr: true*/
(function() {
  'use strict';

  describe('AngularJsonAPIModelValidationError', function() {

    beforeEach(module('angular-jsonapi'));

    it('returns valid model', inject(function(AngularJsonAPIModelValidationError) {
      expect(AngularJsonAPIModelValidationError).toBeDefined();
    }));
  });
})();
