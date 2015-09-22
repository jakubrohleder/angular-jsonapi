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
      type: 'robotModels',
      id: 'uuid4',
      attributes: {
        name: {presence: true, length: {maximum: 20, minimum: 3}},
        code: {presence: true, length: {maximum: 20, minimum: 3}}
      },
      relationships: {
        robots: {
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
    var restSynchro = new AngularJsonAPISynchronizationRest('Rest synchronization', 'http://localhost:3000/robotModels');
    var synchronizer = new AngularJsonAPISynchronizerSimple([localeSynchro, restSynchro]);

    $jsonapi.addFactory(schema, synchronizer);
  })
  .factory('RobotModels', RobotModels);

  function RobotModels(
    $jsonapi
  ) {
    return $jsonapi.getFactory('robotModels');
  }
})();
