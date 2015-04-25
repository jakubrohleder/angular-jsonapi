'use strict';

describe('$$AngularJsonAPICollection service', function(){

  beforeEach(module('angularJsonapi'));

  it('returns valid model', inject(function($$AngularJsonAPICollection){
    expect($$AngularJsonAPICollection).to.be.ok;
  }));

});
