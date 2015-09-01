/*jshint expr: true*/
'use strict';

describe('AngularJsonAPIModelValidator factory', function() {

  beforeEach(module('angular-jsonapi'));

  it('returns valid model', inject(function(AngularJsonAPIModelValidator) {
    expect(AngularJsonAPIModelValidator).to.be.ok;
  }));

});
