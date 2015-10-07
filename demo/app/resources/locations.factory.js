(function() {
  'use strict';

  angular.module('angularJsonapiExample')
  .run(function(
    $jsonapi,
    AngularJsonAPISourceLocal,
    AngularJsonAPISourceRest,
    AngularJsonAPISynchronizerSimple,
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

    var localeSynchro = AngularJsonAPISourceLocal.create('LocalStore synchronization', 'AngularJsonAPI');
    var restSynchro = AngularJsonAPISourceRest.create('Rest synchronization', apiURL + '/locations');
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
