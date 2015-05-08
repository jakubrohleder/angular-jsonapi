(function() {
  'use strict';

  angular.module('angularJsonapiExample')
  .run(function(
    $jsonapi,
    AngularJsonAPISynchronizationLocal,
    AngularJsonAPISynchronizationRest
  ) {
    var peopleSchema = {
      type: 'people',
      id: 'uuid4',
      firstName: ['required', 'string'],
      lastName: ['required', 'string'],
      links: {
        novels: {
          type: 'hasMany',
          reflection: 'author'
        }
      },
      functions: {
        toString: function() {
          if (!this.data.firstName && !this.data.lastName) {
            return this.data.id;
          }

          return this.data.firstName + ' ' + this.data.lastName;
        }
      }
    };

    var localeSynchro = new AngularJsonAPISynchronizationLocal('AngularJsonAPI');
    var peopleSynchro = new AngularJsonAPISynchronizationRest('/people');
    peopleSynchro.extend(localeSynchro);

    $jsonapi.addModel(peopleSchema, peopleSynchro);
  })
  .factory('People', People);

  function People(
    $jsonapi
  ) {
    return $jsonapi.getModel('novels');
  }
})();
