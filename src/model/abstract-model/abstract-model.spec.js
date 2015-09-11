/*jshint expr: true*/
(function() {
  'use strict';

  describe('AngularJsonAPIAbstractModel', function() {

    beforeEach(module('angular-jsonapi'));

    it('returns valid model', inject(function(AngularJsonAPIAbstractModel) {
      expect(AngularJsonAPIAbstractModel).toBeDefined();
    }));
  });
})();
