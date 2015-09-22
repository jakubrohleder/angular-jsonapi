/*jshint expr: true*/
(function() {
  'use strict';

  describe('AngularJsonAPICollection', function() {

    beforeEach(module('angular-jsonapi'));

    it('returns valid model', inject(function(AngularJsonAPICollection) {
      expect(AngularJsonAPICollection).toBeDefined();
    }));
  });
})();
