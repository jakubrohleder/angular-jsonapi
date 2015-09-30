/*jshint expr: true*/
(function() {
  'use strict';

  describe('AngularJsonAPISchemaLink', function() {

    beforeEach(module('angular-jsonapi'));

    it('returns valid model', inject(function(AngularJsonAPISchemaLink) {
      expect(AngularJsonAPISchemaLink).toBeDefined();
    }));
  });
})();
