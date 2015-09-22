(function() {
  'use strict';

  angular.module('angularJsonapiExample')
  .run(function(
    $jsonapi,
    AngularJsonAPISynchronizationLocal,
    AngularJsonAPISynchronizationRest,
    AngularJsonAPISynchronizerSimple
  ) {
    var schema = {
      type: 'locations',
      id: 'uuid4',
      attributes: {
        cordsX: {presence: true, numericality: {onlyInteger: true}},
        cordsY: {presence: true, numericality: {onlyInteger: true}}
      },
      relationships: {
        planet: {
          included: true,
          type: 'hasOne'
        },
        entity: {
          included: true,
          type: 'hasOne',
          polymorphic: true,
          reflection: 'location'
        }
      },
      functions: {
        toString: function() {
          if (!this.relationships.planet || !this.relationships.planet.data.attributes.name) {
            return this.data.id;
          }

          return this.relationships.planet.data.attributes.name;
        }
      }
    };

    var localeSynchro = new AngularJsonAPISynchronizationLocal('LocalStore synchronization', 'AngularJsonAPI');
    var restSynchro = new AngularJsonAPISynchronizationRest('Rest synchronization', 'http://localhost:3000/locations');
    var synchronizer = new AngularJsonAPISynchronizerSimple([localeSynchro, restSynchro]);

    $jsonapi.addFactory(schema, synchronizer);
  })
  .factory('Locations', Locations);

  function Locations(
    $jsonapi
  ) {
    return $jsonapi.getFactory('locations');
  }
})();
