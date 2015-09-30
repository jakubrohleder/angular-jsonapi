/*jshint expr: true*/
(function() {
  'use strict';

  describe('AngularJsonAPIResource', function() {

    beforeEach(module('angular-jsonapi'));

    it('returns valid model', inject(function(AngularJsonAPIResource) {
      expect(AngularJsonAPIResource).toBeDefined();
    }));
  });
})();
