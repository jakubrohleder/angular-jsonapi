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
      type: 'spaceships',
      id: 'uuid4',
      attributes: {
        name: 'string',
        durability: 'number',
        cordY: 'number',
        cordZ: 'number',
        size: 'number'
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

    var localeSynchro = new AngularJsonAPISynchronizationLocal('AngularJsonAPI');
    var restSynchro = new AngularJsonAPISynchronizationRest('http://localhost:3000/spaceships');
    var synchronizer = new AngularJsonAPISynchronizerSimple([localeSynchro, restSynchro]);

    $jsonapi.addFactory(schema, synchronizer);
  })
  .factory('Spaceships', Spaceships);

  function Spaceships(
    $jsonapi
  ) {
    return $jsonapi.getFactory('spaceships');
  }
})();
