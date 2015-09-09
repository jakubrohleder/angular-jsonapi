(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .service('AngularJsonAPIModelLinkerService', AngularJsonAPIModelLinkerService);

  function AngularJsonAPIModelLinkerService($log) {
    var _this = this;

    _this.toLinkData = toLinkData;

    _this.link = link;
    _this.unlink = unlink;

    return this;

    /**
     * Extracts data needed for relationship linking from object
     * @param  {AngularJsonAPIModel} object Object
     * @return {json}        Link data
     */
    function toLinkData(object) {
      if (object === null) {
        return null;
      }

      return {type: object.data.type, id: object.data.id};
    }

    /**
     * Add target to object relationships and data.relationships
     * @param {AngularJsonAPIModel} object     Object to be modified
     * @param {string} key        Relationship name
     * @param {AngularJsonAPIModel} target     Object to be linked
     * @param {AngularJsonAPISchema} schema     Relationship schema
     */
    function link(object, key, target, oneWay) {
      var schema;

      if (object === undefined) {
        $log.error('Can\'t add link to non existing object', object, key, target);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        return false;
      }

      schema = object.schema.relationships[key];

      if (target === undefined) {
        $log.error('Can\'t link non existing object', object, key, target, schema);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        $log.error('Schema:', schema);
        return false;
      }

      if (schema === undefined) {
        $log.error('Can\'t add link not present in schema:', object, key, target, schema);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        $log.error('Schema:', schema);
        return false;
      }

      if (target !== null && schema.polymorphic === false && schema.model !== target.data.type) {
        $log.error('This relation is not polymorphic, expected: ' + schema.model + ' instead of ' + target.data.type);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        $log.error('Schema:', schema);
        return false;
      }

      if (schema.type === 'hasMany') {
        if (oneWay === true) {
          return __addHasMany(object, key, target);
        } else {
          return __processAddHasMany(object, key, target);
        }
      } else if (schema.type === 'hasOne') {
        if (oneWay === true) {
          return __addHasOne(object, key, target);
        } else {
          return __processAddHasOne(object, key, target);
        }
      }
    }

    /**
     * Remove target from object relationships and data.relationships
     * @param {AngularJsonAPIModel} object     Object to be modified
     * @param {string} key        Relationship name
     * @param {AngularJsonAPIModel} target     Object to be unlinked
     * @param {AngularJsonAPISchema} schema     Relationship schema
     */
    function unlink(object, key, target, oneWay) {
      var schema;

      if (object === undefined) {
        $log.error('Can\'t remove link from non existing object', object, key, target);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        return false;
      }

      schema = object.schema.relationships[key];

      if (schema === undefined) {
        $log.error('Can\'t remove link not present in schema:', object, key, target, schema);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        $log.error('Schema:', schema);
        return false;
      }

      if (oneWay === true) {
        return __removeHasMany(object, key, target);
      } else {
        return __processRemove(object, key, target);
      }
    }

    /////////////
    // Private //
    /////////////

    function __processAddHasMany(object, key, target) {
      var reflectionKey = object.schema.relationships[key].reflection;
      var reflectionSchema;

      if (reflectionKey === false) {
        return __addHasMany(object, key, target);
      }

      reflectionSchema = target.schema.relationships[reflectionKey];

      if (reflectionSchema.type === 'hasOne') {
        __processAddHasOne(target, reflectionKey, object);
      } else if (reflectionSchema.type === 'hasMany') {
        __addHasMany(object, key, target);
        __addHasMany(target, reflectionKey, object);
      }
    }

    function __processAddHasOne(object, key, target) {
      var reflectionKey = object.schema.relationships[key].reflection;
      var reflectionSchema;
      var reflection = object.relationships[key];

      __addHasOne(object, key, target);

      if (reflectionKey === false) {
        return;
      }

      reflectionSchema = target.schema.relationships[reflectionKey];

      if (reflectionSchema.type === 'hasOne') {
        if (reflection !== undefined && reflection !== null) {
          __removeHasOne(reflection, reflectionKey, object);
        }

        __addHasOne(target, reflectionKey, object);
      } else if (reflectionSchema.type === 'hasMany') {
        if (reflection !== undefined && reflection !== null) {
          __removeHasMany(reflection, reflectionKey, object);
        }

        __addHasMany(target, reflectionKey, object);
      }
    }

    function __processRemove(object, key, target) {
      var schema = object.schema.relationships[key];
      var reflectionKey = schema.reflection;
      var reflectionSchema;

      if (schema.type === 'hasMany') {
        __removeHasMany(object, key, target);
      } else if (schema.type === 'hasOne') {
        __removeHasOne(object, key, target);
      }

      if (reflectionKey === false) {
        return;
      }

      reflectionSchema = target.schema.relationships[reflectionKey];

      if (reflectionSchema.type === 'hasOne') {
        __removeHasOne(target, reflectionKey, object);
      } else if (reflectionSchema.type === 'hasMany') {
        __removeHasMany(target, reflectionKey, object);
      }
    }

    function __addHasOne(object, key, target) {
      $log.debug('addHasOne', object, key, target);

      object.relationships[key] = target;
      object.data.relationships[key].data = toLinkData(target);

      return true;
    }

    function __addHasMany(object, key, target) {
      var linkData = toLinkData(target);
      $log.debug('addHasMany', object, key, target);

      if (angular.isArray(object.relationships[key]) && object.relationships[key].indexOf(target) > -1) {
        return false;
      }

      object.relationships[key] = object.relationships[key] || [];
      object.data.relationships[key].data = object.data.relationships[key].data || [];

      object.relationships[key].push(target);
      object.data.relationships[key].data.push(linkData);

      return true;
    }

    function __removeHasOne(object, key, target) {
      $log.debug('removeHasOne', object, key, target);

      if (target !== undefined && object.relationships[key] !== target) {
        return false;
      }

      object.relationships[key] = null;
      object.data.relationships[key].data = undefined;

      return true;
    }

    function __removeHasMany(object, key, target) {
      $log.debug('removeHasMany', object, key, target);

      if (object.relationships[key] === undefined) {
        return;
      }

      if (target === undefined) {
        object.relationships[key] = [];
        object.data.relationships[key].data = [];
        return true;
      }

      var index = object.relationships[key].indexOf(target);

      if (index === -1) {
        return false;
      }

      object.relationships[key].splice(index, 1);
      object.data.relationships[key].data.splice(index, 1);

      return true;
    }
  }
})();
