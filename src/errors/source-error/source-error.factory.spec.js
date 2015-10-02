/*jshint expr: true*/
(function() {
  'use strict';

  describe('AngularJsonAPIModelSourceError', function() {

    beforeEach(module('angular-jsonapi'));

    it('returns valid model', inject(function(AngularJsonAPIModelSourceError) {
      expect(AngularJsonAPIModelSourceError).toBeDefined();
    }));
  });
})();
