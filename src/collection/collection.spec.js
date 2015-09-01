/*jshint expr: true*/
'use strict';

describe('AngularJsonAPICollection', function() {

  beforeEach(module('angular-jsonapi'));

  it('returns valid model', inject(function(AngularJsonAPICollection) {
    expect(AngularJsonAPICollection).to.be.ok;
  }));

  describe('#refresh()', function() {

  });

});
