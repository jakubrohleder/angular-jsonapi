/*jshint expr: true*/
'use strict';

describe('$jsonapi provider', function() {

  beforeEach(module('angular-jsonapi'));

  it('returns valid model', inject(function($jsonapi) {
    expect($jsonapi).to.be.ok;
  }));

});
