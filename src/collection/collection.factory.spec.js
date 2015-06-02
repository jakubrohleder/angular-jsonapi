/*jshint expr: true*/
'use strict';

describe('AngularJsonAPICollection factory', function() {

  beforeEach(module('angular-jsonapi'));

  it('returns valid model', inject(function(AngularJsonAPICollection) {
    expect(AngularJsonAPICollection).to.be.ok;
  }));

});
