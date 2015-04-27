/*jshint expr: true*/
'use strict';

describe('JsonAPIModelFactory factory', function() {
  var schema = {
    type: 'novels',
    id: 'uuid4',
    title: 'string',
    part: 'integer',
    links: {
      author: 'hasOne',
      dieties: 'hasMany'
    }
  };
  var linkGetters = {
    author: function(id) {
      return {id: id, name: 'Howard Phillips Lovecraft'};
    },

    dieties: function(ids) {
      return [{id: ids[0], name: 'Shub-Niggurath'}, {id: ids[1], name: 'Evil twins Nug and Yeb'}];
    }
  };
  var data = {
    type: 'novels',
    id: '975fe66c-43c6-46cb-98fe-1cac46370de2',
    title: 'An Epicure in the Terrible',
    part: 1,
    links: {
      self: 'http://example.com/novels/1',
      author: {
        self: 'http://example.com/novels/1/links/author',
        related: 'http://example.com/novels/1/author',
        linkage: { type: 'people', id: '873edec0-5266-463f-9fd4-24365637b4f4' }
      },
      dieties: {
        self: 'http://example.com/novels/1/links/dieties',
        related: 'http://example.com/novels/1/dieties',
        linkage: [
          { type: 'dieties', id: '0214cffb-3269-47df-a910-13088d3344cb' },
          { type: 'dieties', id: '1d75c7bc-4c4f-4923-98d4-a53caa137c09' }
        ]
      }
    }
  };

  beforeEach(module('angularJsonapi'));

  var Novel;
  var validNovel;
  var invalidNovel;

  beforeEach(inject(function(_JsonAPIModelFactory_) {
    var invalidData = angular.copy(data);
    Novel = _JsonAPIModelFactory_.model(schema, linkGetters);
    validNovel = new Novel(data);

    invalidData.id = 'adsad';
    invalidData.title = 34;
    invalidData.part = 'asdasd';
    invalidNovel = new Novel(invalidData);
  }));

  it('is ok', inject(function(JsonAPIModelFactory) {
    expect(JsonAPIModelFactory).to.be.ok;
    expect(Novel).to.be.ok;
    expect(Novel.prototype.schema).to.deep.equal(schema);
    expect(Novel.prototype.linkGetters).to.deep.equal(linkGetters);
  }));

  it('validates validNovel', function() {
    expect(validNovel.errors.title).to.be.empty;
    expect(validNovel.errors.part).to.be.empty;
  });

  it('produces errors for invalidNovel', function() {
    expect(invalidNovel.errors.validation.title).to.have.length(1);
    expect(invalidNovel.errors.validation.part).to.have.length(1);
    expect(invalidNovel.errors.validation.id).to.have.length(1);
  });

  it('set links for hasOne', function() {
    expect(validNovel.links.author('id')).to.deep.equal(linkGetters.author('873edec0-5266-463f-9fd4-24365637b4f4'));
  });

  it('set links for hasMany', function() {
    expect(validNovel.links.dieties()).to.deep.equal(linkGetters.dieties(['0214cffb-3269-47df-a910-13088d3344cb', '1d75c7bc-4c4f-4923-98d4-a53caa137c09']));
  });

  it('can be updated by valid form', function() {
    validNovel.form.data.title = 'New title';
    expect(validNovel.form.save()).to.be.fulfilled;
    expect(validNovel.data.title).to.equal('New title');
  });

  it('cannot be updated by invalid form', function() {
    validNovel.form.data.part = 'wrong';
    var promise = validNovel.form.save();
    expect(promise).to.be.rejected;
    expect(validNovel.data.part).to.equal(1);
  });
});
