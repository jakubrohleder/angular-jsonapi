/*jshint expr: true*/
(function() {
  'use strict';

  describe('AngularJsonAPISynchronizerSimple', function() {

    beforeEach(module('angular-jsonapi'));

    it('returns valid model', inject(function(AngularJsonAPISynchronizerSimple) {
      expect(AngularJsonAPISynchronizerSimple).toBeDefined();
    }));
  });
})();
