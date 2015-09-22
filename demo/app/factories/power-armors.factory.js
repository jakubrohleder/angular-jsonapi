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
      type: 'powerArmors',
      id: 'uuid4',
      attributes: {
        name: {presence: true, length: {maximum: 20, minimum: 3}},
        durability: {presence: true, numericality: {onlyInteger: true}},
        quality: {presence: true, numericality: {onlyInteger: true}},
        armor: {presence: true, numericality: {onlyInteger: true}},
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

    var localeSynchro = new AngularJsonAPISynchronizationLocal('LocalStore synchronization', 'AngularJsonAPI');
    var restSynchro = new AngularJsonAPISynchronizationRest('Rest synchronization', 'http://localhost:3000/powerArmors');
    var synchronizer = new AngularJsonAPISynchronizerSimple([localeSynchro, restSynchro]);

    $jsonapi.addFactory(schema, synchronizer);
  })
  .factory('PowerArmors', PowerArmors);

  function PowerArmors(
    $jsonapi
  ) {
    return $jsonapi.getFactory('powerArmors');
  }
})();
