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
      type: 'robots',
      id: '',
      attributes: {
        nameFirst: {presence: true, length: {maximum: 20, minimum: 3}},
        nameLast: {presence: true, length: {maximum: 20, minimum: 3}},
        creationDate: {datetime: true},
        pictureUrl: {presence: true}
      },
      relationships: {
        location: {
          included: true,
          type: 'hasOne',
          reflection: 'entity'
        },
        robotModel: {
          included: true,
          type: 'hasOne',
        },
        job: {
          included: true,
          type: 'hasOne',
        },
        laserGuns: {
          included: true,
          type: 'hasMany',
          reflection: 'owner'
        },
        powerArmors: {
          included: true,
          type: 'hasMany',
          reflection: 'owner'
        },
        spaceships: {
          included: true,
          type: 'hasMany',
          reflection: 'pilot'
        }
      },
      include: {
        get: ['location.planet']
      },
      functions: {
        toString: function() {
          if (!this.data.attributes.nameFirst && !this.data.attributes.nameLast) {
            return this.data.id;
          }

          return this.data.attributes.nameFirst + this.data.attributes.nameLast;
        }
      }
    };

    var localeSynchro = AngularJsonAPISynchronizationLocal.create('LocalStore synchronization', 'AngularJsonAPI');
    var restSynchro = AngularJsonAPISynchronizationRest.create('Rest synchronization', apiURL + '/robots');
    var synchronizer = AngularJsonAPISynchronizerSimple.create([localeSynchro, restSynchro]);

    $jsonapi.addResource(schema, synchronizer);
  })
  .factory('Robots', Robots);

  function Robots(
    $jsonapi
  ) {
    return $jsonapi.getResource('robots');
  }
})();
