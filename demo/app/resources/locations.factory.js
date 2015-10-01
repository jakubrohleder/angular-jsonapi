(function() {
  'use strict';

  angular.module('angularJsonapiExample')
  .run(function(
    $jsonapi,
    AngularJsonAPISynchronizationLocal,
    AngularJsonAPISynchronizationRest,
    AngularJsonAPISynchronizerSimple,
    apiURL
  ) {
    var schema = {
      type: 'locations',
      id: '',
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

    var localeSynchro = AngularJsonAPISynchronizationLocal.create('LocalStore synchronization', 'AngularJsonAPI');
    var restSynchro = AngularJsonAPISynchronizationRest.create('Rest synchronization', apiURL + '/locations');
    var synchronizer = AngularJsonAPISynchronizerSimple.create([localeSynchro, restSynchro]);

    $jsonapi.addResource(schema, synchronizer);
  })
  .factory('Locations', Locations);

  function Locations(
    $jsonapi
  ) {
    return $jsonapi.getResource('locations');
  }
})();
