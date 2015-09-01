/*jshint expr: true*/
'use strict';

describe('AngularJsonAPIFactory factory', function() {

  beforeEach(module('angular-jsonapi'));

  it('returns valid model', inject(function(AngularJsonAPIFactory) {
    expect(AngularJsonAPIFactory).to.be.ok;
  }));

});
