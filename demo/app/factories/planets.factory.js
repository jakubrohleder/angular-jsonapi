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
      type: 'planets',
      id: 'uuid4',
      attributes: {
        name: {presence: true, length: {maximum: 20, minimum: 3}},
        cordsX: {presence: true, numericality: {onlyInteger: true}},
        cordsY: {presence: true, numericality: {onlyInteger: true}},
        cordsZ: {presence: true, numericality: {onlyInteger: true}},
        size: {presence: true, numericality: {onlyInteger: true}}
      },
      relationships: {
        locations: {
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

    var localeSynchro = new AngularJsonAPISynchronizationLocal('LocalStore synchronization', 'AngularJsonAPI');
    var restSynchro = new AngularJsonAPISynchronizationRest('Rest synchronization', 'http://localhost:3000/planets');
    var synchronizer = new AngularJsonAPISynchronizerSimple([localeSynchro, restSynchro]);

    $jsonapi.addFactory(schema, synchronizer);
  })
  .factory('Planets', Planets);

  function Planets(
    $jsonapi
  ) {
    return $jsonapi.getFactory('planets');
  }
})();
