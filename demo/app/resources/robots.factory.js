(function() {
  'use strict';

  angular.module('angularJsonapiExample')
  .run(function(
    $jsonapi,
    apiURL
  ) {
    var schema = {
      type: 'robots',
      id: 'uuid4',
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
          type: 'hasOne'
        },
        job: {
          included: true,
          type: 'hasOne'
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

    var localeSynchro = $jsonapi.sourceLocal.create('LocalStore synchronization', 'AngularJsonAPI');
    var restSynchro = $jsonapi.sourceRest.create('Rest synchronization', apiURL + '/robots');
    var synchronizer = $jsonapi.synchronizerSimple.create([localeSynchro, restSynchro]);

    $jsonapi.addResource(schema, synchronizer);
  })
  .factory('Robots', Robots);

  function Robots(
    $jsonapi
  ) {
    return $jsonapi.getResource('robots');
  }
})();
