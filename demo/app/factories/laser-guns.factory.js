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
      type: 'laserGuns',
      id: 'uuid4',
      attributes: {
        name: {presence: true, length: {maximum: 20, minimum: 3}},
        durability: {presence: true, numericality: {onlyInteger: true}},
        quality: {presence: true, numericality: {onlyInteger: true}},
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

    var localeSynchro = new AngularJsonAPISynchronizationLocal('AngularJsonAPI');
    var restSynchro = new AngularJsonAPISynchronizationRest('http://localhost:3000/laserGuns');
    var synchronizer = new AngularJsonAPISynchronizerSimple([localeSynchro, restSynchro]);

    $jsonapi.addFactory(schema, synchronizer);
  })
  .factory('Jobs', Jobs);

  function Jobs(
    $jsonapi
  ) {
    return $jsonapi.getFactory('laserGuns');
  }
})();
