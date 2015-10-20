(function() {
  'use strict';

  angular.module('angularJsonapiExample')
  .run(function(
    $jsonapi,
    apiURL
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

    var localeSynchro = $jsonapi.sourceLocal.create('LocalStore synchronization', 'AngularJsonAPI');
    var restSynchro = $jsonapi.sourceRest.create('Rest synchronization', apiURL + '/locations');
    var synchronizer = $jsonapi.synchronizerSimple.create([localeSynchro, restSynchro]);

    $jsonapi.addResource(schema, synchronizer);
  })
  .factory('Locations', Locations);

  function Locations(
    $jsonapi
  ) {
    return $jsonapi.getResource('locations');
  }
})();
