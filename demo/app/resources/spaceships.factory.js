(function() {
  'use strict';

  angular.module('angularJsonapiExample')
  .run(function(
    $jsonapi,
    apiURL
  ) {
    var schema = {
      type: 'spaceships',
      id: 'uuid4',
      attributes: {
        name: {presence: true, length: {maximum: 20, minimum: 3}},
        durability: {presence: true, numericality: {onlyInteger: true}},
        quality: {presence: true, numericality: {onlyInteger: true}}
      },
      relationships: {
        pilot: {
          included: true,
          type: 'hasOne',
          reflection: 'spaceships',
          polymorphic: true
        },
        spaceshipModel: {
          included: true,
          type: 'hasOne'
        },
        location: {
          included: true,
          type: 'hasOne',
          reflection: 'entity'
        }
      },
      functions: {
        toString: function() {
          if (!this.data.attributes.name) {
            return this.data.id;
          }

          return this.data.attributes.name;
        }
      }
    };

    var localeSynchro = $jsonapi.sourceLocal.create('LocalStore synchronization', 'AngularJsonAPI');
    var restSynchro = $jsonapi.sourceRest.create('Rest synchronization', apiURL + '/spaceships');
    var synchronizer = $jsonapi.synchronizerSimple.create([localeSynchro, restSynchro]);

    $jsonapi.addResource(schema, synchronizer);
  })
  .factory('Spaceships', Spaceships);

  function Spaceships(
    $jsonapi
  ) {
    return $jsonapi.getResource('spaceships');
  }
})();
