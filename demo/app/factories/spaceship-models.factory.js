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
      type: 'spaceship-models',
      id: 'uuid4',
      attributes: {
        name: 'string',
        code: 'string',
        speed: 'number',
        cargo: 'number',
        type: 'string'
      },
      relationships: {
        spaceships: {
          included: true,
          type: 'hasMany'
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
    var restSynchro = new AngularJsonAPISynchronizationRest('http://localhost:3000/spaceship-models');
    var synchronizer = new AngularJsonAPISynchronizerSimple([localeSynchro, restSynchro]);

    $jsonapi.addFactory(schema, synchronizer);
  })
  .factory('SpaceshipModels', SpaceshipModels);

  function SpaceshipModels(
    $jsonapi
  ) {
    return $jsonapi.getFactory('spaceship-models');
  }
})();
