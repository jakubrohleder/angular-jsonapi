(function() {
  'use strict';

  angular.module('angularJsonapiExample')
  .run(function(
    $jsonapi,
    AngularJsonAPISynchronizationLocal,
    AngularJsonAPISynchronizationRest,
    AngularJsonAPISynchronizerSimple,
    apiURL
  ) {
    var schema = {
      type: 'jobs',
      id: '',
      attributes: {
        name: {presence: true, length: {maximum: 20, minimum: 3}},
        salary: {presence: true, numericality: {onlyInteger: true}}
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

    var localeSynchro = AngularJsonAPISynchronizationLocal.create('LocalStore synchronization', 'AngularJsonAPI');
    var restSynchro = AngularJsonAPISynchronizationRest.create('Rest synchronization', apiURL + '/jobs');
    var synchronizer = AngularJsonAPISynchronizerSimple.create([localeSynchro, restSynchro]);

    $jsonapi.addResource(schema, synchronizer);
  })
  .factory('Jobs', Jobs);

  function Jobs(
    $jsonapi
  ) {
    return $jsonapi.getResource('jobs');
  }
})();
