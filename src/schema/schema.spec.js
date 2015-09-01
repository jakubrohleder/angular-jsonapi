/*jshint expr: true*/
(function() {
  'use strict';

  describe('AngularJsonAPISchema', function() {

    beforeEach(module('angular-jsonapi'));

    it('returns valid model', inject(function(AngularJsonAPISchema) {
      expect(AngularJsonAPISchema).toBeDefined();
    }));
  });
})();
