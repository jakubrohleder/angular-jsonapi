(function() {
  'use strict';

  angular.module('angularJsonapiExample')
  .run(function(
    $jsonapi,
    apiURL
  ) {
    var schema = {
      type: 'laserGuns',
      id: 'uuid4',
      attributes: {
        name: {presence: true, length: {maximum: 20, minimum: 3}},
        durability: {presence: true, numericality: {onlyInteger: true}},
        quality: {presence: true, numericality: {onlyInteger: true}},
        power: {presence: true, numericality: {onlyInteger: true}},
        type: {presence: true, length: {maximum: 20, minimum: 3}},
        rarity: {presence: true, length: {maximum: 20, minimum: 3}}
      },
      relationships: {
        owner: {
          included: true,
          type: 'hasOne',
          polymorphic: true
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
    var restSynchro = $jsonapi.sourceRest.create('Rest synchronization', apiURL + '/laserGuns');
    var synchronizer = $jsonapi.synchronizerSimple.create([localeSynchro, restSynchro]);

    $jsonapi.addResource(schema, synchronizer);
  })
  .factory('Jobs', Jobs);

  function Jobs(
    $jsonapi
  ) {
    return $jsonapi.getResource('laserGuns');
  }
})();
