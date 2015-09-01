/*jshint expr: true*/
(function() {
  'use strict';

  describe('AngularJsonAPIModelValidatorService', function() {

    beforeEach(module('angular-jsonapi'));

    it('returns valid model', inject(function(AngularJsonAPIModelValidatorService) {
      expect(AngularJsonAPIModelValidatorService).toBeDefined();
    }));
  });
})();
