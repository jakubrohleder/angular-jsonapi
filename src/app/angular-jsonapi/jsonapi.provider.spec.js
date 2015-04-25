'use strict';

describe('$jsonapi provider', function(){

  beforeEach(module('angularJsonapi'));

  it('returns valid model', inject(function($jsonapi){
    expect($jsonapi).to.be.ok;
  }));

});
