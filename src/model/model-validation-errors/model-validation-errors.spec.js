/*jshint expr: true*/
(function() {
  'use strict';

  describe('AngularJsonAPIModelValidationErrors', function() {

    beforeEach(module('angular-jsonapi'));

    it('returns valid model', inject(function(AngularJsonAPIModelValidationErrors) {
      expect(AngularJsonAPIModelValidationErrors).toBeDefined();
    }));
  });
})();
