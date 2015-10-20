(function() {
  'use strict';

  angular.module('angularJsonapiExample')
  .run(function(
    $jsonapi,
    apiURL
  ) {
    var schema = {
      type: 'spaceshipModels',
      id: 'uuid4',
      attributes: {
        name: {presence: true, length: {maximum: 20, minimum: 3}},
        code: {presence: true, length: {maximum: 20, minimum: 3}},
        speed: {presence: true, numericality: {onlyInteger: true}},
        cargo: {presence: true, numericality: {onlyInteger: true}},
        type: {presence: true, length: {maximum: 20, minimum: 3}}
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

    var localeSynchro = $jsonapi.sourceLocal.create('LocalStore synchronization', 'AngularJsonAPI');
    var restSynchro = $jsonapi.sourceRest.create('Rest synchronization', apiURL + '/spaceshipModels');
    var synchronizer = $jsonapi.synchronizerSimple.create([localeSynchro, restSynchro]);

    $jsonapi.addResource(schema, synchronizer);
  })
  .factory('SpaceshipModels', SpaceshipModels);

  function SpaceshipModels(
    $jsonapi
  ) {
    return $jsonapi.getResource('spaceshipModels');
  }
})();
