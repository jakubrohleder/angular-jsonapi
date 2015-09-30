/*jshint expr: true*/
(function() {
  'use strict';

  describe('AngularJsonAPIModelSynchronizationError', function() {

    beforeEach(module('angular-jsonapi'));

    it('returns valid model', inject(function(AngularJsonAPIModelSynchronizationError) {
      expect(AngularJsonAPIModelSynchronizationError).toBeDefined();
    }));
  });
})();
