/*jshint expr: true*/
'use strict';

describe('AngularJsonAPIFactoryCache', function() {

  beforeEach(module('angular-jsonapi'));

  it('returns valid model', inject(function(AngularJsonAPIFactoryCache) {
    expect(AngularJsonAPIFactoryCache).to.be.ok;
  }));

  describe('#fromJson()', function() {

  });

  describe('#toJson()', function() {

  });

});
