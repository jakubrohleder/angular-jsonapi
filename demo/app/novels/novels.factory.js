(function() {
  'use strict';

  angular.module('angularJsonapiExample')
  .run(function(
    $jsonapi,
    AngularJsonAPISynchronizationLocal,
    AngularJsonAPISynchronizationRest
  ) {
    var novelsSchema = {
      type: 'novels',
      id: 'uuid4',
      attributes: {
        title: ['required', 'string', {minlength: 3}, {maxlength: 50}],
        part: ['integer', {maxvalue: 10, minvalue: 1}]
      },
      relationships: {
        author: {
          included: true,
          type: 'hasOne',
          model: 'people'
        },
        dieties: {
          included: true,
          type: 'hasMany',
          reflection: 'apearences'
        }
      },
      functions: {
        toString: function() {
          if (!this.data.attributes.title) {
            return this.data.id;
          }

          return this.data.attributes.title;
        }
      }
    };

    var localeSynchro = new AngularJsonAPISynchronizationLocal('AngularJsonAPI');
    var novelsSynchro = new AngularJsonAPISynchronizationRest('/novels');
    novelsSynchro.extend(localeSynchro);

    $jsonapi.addModel(novelsSchema, novelsSynchro);
  })
  .factory('Novels', Novels);

  function Novels(
    $jsonapi
  ) {
    return $jsonapi.getModel('novels');
  }
})();
