/*jshint expr: true*/
(function() {
  'use strict';

  describe('AngularJsonAPIFactory', function() {

    beforeEach(module('angular-jsonapi'));

    it('returns valid model', inject(function(AngularJsonAPIFactory) {
      expect(AngularJsonAPIFactory).toBeDefined();
    }));
  });
})();
