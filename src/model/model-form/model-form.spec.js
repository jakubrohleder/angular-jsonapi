/*jshint expr: true*/
(function() {
  'use strict';

  describe('AngularJsonAPIModelForm', function() {

    beforeEach(module('angular-jsonapi'));

    it('returns valid model', inject(function(AngularJsonAPIModelForm) {
      expect(AngularJsonAPIModelForm).toBeDefined();
    }));
  });
})();
