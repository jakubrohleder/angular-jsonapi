/*jshint expr: true*/
(function() {
  'use strict';

  describe('AngularJsonAPIModel', function() {

    beforeEach(module('angular-jsonapi'));

    it('returns valid model', inject(function(AngularJsonAPIModel) {
      expect(AngularJsonAPIModel).toBeDefined();
    }));
  });
})();
