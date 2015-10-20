(function() {
  'use strict';

  angular.module('angularJsonapiExample')
  .run(function(
    $jsonapi,
    apiURL
  ) {
    var schema = {
      type: 'jobs',
      id: 'uuid4',
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

    var localeSynchro = $jsonapi.sourceLocal.create('LocalStore synchronization', 'AngularJsonAPI');
    var restSynchro = $jsonapi.sourceRest.create('Rest synchronization', apiURL + '/jobs');
    var synchronizer = $jsonapi.synchronizerSimple.create([localeSynchro, restSynchro]);

    $jsonapi.addResource(schema, synchronizer);
  })
  .factory('Jobs', Jobs);

  function Jobs(
    $jsonapi
  ) {
    return $jsonapi.getResource('jobs');
  }
})();
