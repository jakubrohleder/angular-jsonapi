/*jshint expr: true*/
(function() {
  'use strict';

  describe('AngularJsonAPIModelLinkerService', function() {

    beforeEach(module('angular-jsonapi'));

    it('returns valid model', inject(function(AngularJsonAPIModelLinkerService) {
      expect(AngularJsonAPIModelLinkerService).toBeDefined();
    }));
  });
})();
