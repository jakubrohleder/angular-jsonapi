/*jshint expr: true*/
(function() {
  'use strict';

  describe('AngularJsonAPIModelErrorsManager', function() {

    beforeEach(module('angular-jsonapi'));

    it('returns valid model', inject(function(AngularJsonAPIModelErrorsManager) {
      expect(AngularJsonAPIModelErrorsManager).toBeDefined();
    }));
  });
})();
