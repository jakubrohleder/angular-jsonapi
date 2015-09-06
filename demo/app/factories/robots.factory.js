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
      type: 'robots',
      id: 'uuid4',
      attributes: {
        nameFirst: 'string',
        nameLast: 'string',
        creationDate: 'date',
        pictureUrl: 'string'
      },
      relationships: {
        location: {
          included: true,
          type: 'hasOne',
          reflection: 'entity'
        },
        origin: {
          included: true,
          type: 'hasOne',
          model: 'locations'
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
          type: 'hasMany'
        },
        powerArmors: {
          included: true,
          type: 'hasMany'
        },
        spaceships: {
          included: true,
          type: 'hasMany',
          reflection: 'pilot'
        }
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

    var localeSynchro = new AngularJsonAPISynchronizationLocal('AngularJsonAPI');
    var restSynchro = new AngularJsonAPISynchronizationRest('http://localhost:3000/robots');
    var synchronizer = new AngularJsonAPISynchronizerSimple([localeSynchro, restSynchro]);

    $jsonapi.addFactory(schema, synchronizer);
  })
  .factory('Robots', Robots);

  function Robots(
    $jsonapi
  ) {
    return $jsonapi.getFactory('robots');
  }
})();
