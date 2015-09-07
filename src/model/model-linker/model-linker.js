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
    function link(object, key, target, schema) {

      if (target === undefined) {
        $log.error('Can\'t link non existing object', object, key, target, schema);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        $log.error('Schema:', schema);
        return false;
      }

      if (object === undefined) {
        $log.error('Can\'t add link to non existing object', object, key, target, schema);
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
        return __addHasMany(object, key, target, schema);
      } else if (schema.type === 'hasOne') {
        return __addHasOne(object, key, target, schema);
      }
    }

    /**
     * Remove target from object relationships and data.relationships
     * @param {AngularJsonAPIModel} object     Object to be modified
     * @param {string} key        Relationship name
     * @param {AngularJsonAPIModel} target     Object to be unlinked
     * @param {AngularJsonAPISchema} schema     Relationship schema
     */
    function unlink(object, key, target, schema) {
      if (schema === undefined) {
        $log.error('Can\'t remove link not present in schema: ' + key);
        return;
      }

      if (schema.type === 'hasMany') {
        return __removeHasMany(object, key, target, schema);
      } else if (schema.type === 'hasOne') {
        return __removeHasOne(object, key, target, schema);
      }
    }

    /////////////
    // Private //
    /////////////

    function __addHasOne(object, key, target, schema) {
      $log.debug('addHasOne', object, key, target, schema);

      if (target !== null && object.relationships[key] === target) {
        // $log.warn(target.data.type + ':' + target.data.id, 'is already linked to', object.data.type + ':' + object.data.id, 'as', key);
        return false;
      } else {
        object.relationships[key] = target;
        object.data.relationships[key].data = toLinkData(target);
      }

      return true;
    }

    function __addHasMany(object, key, target, schema) {
      var linkData = toLinkData(target);
      $log.debug('addHasMany', object, key, target, schema);

      if (angular.isArray(object.relationships[key]) && object.relationships[key].indexOf(target) > -1) {
        $log.warn(target.data.type + ':' + target.data.id, 'is already linked to', object.data.type + ':' + object.data.id, 'as', key);
        return false;
      } else {
        object.relationships[key] = object.relationships[key] || [];
        object.relationships[key].push(target);
        object.data.relationships[key].data = object.data.relationships[key].data || [];
        $log.warn(target.data.type + ':' + target.data.id, 'is being linked to', object.data.type + ':' + object.data.id, 'as', key);
        object.data.relationships[key].data.push(linkData);
      }

      return true;
    }

    function __removeHasOne(object, key, target, schema) {
      $log.log('removeHasOne', object, key, target, schema);

      if (target !== undefined && object.relationships[key] !== target) {
        // $log.warn(target.data.type + ':' + target.data.id, 'is not linked to', object.data.type + ':' + object.data.id, 'as', key);
        return false;
      } else {
        object.relationships[key] = null;
        object.data.relationships[key].data = undefined;
      }

      return true;
    }

    function __removeHasMany(object, key, target, schema) {
      $log.debug('removeHasMany', object, key, target, schema);

      if (target === undefined) {
        object.relationships[key] = [];
        object.data.relationships[key].data = [];
      } else if (object.relationships[key] === undefined) {
        $log.warn(target.data.type + ':' + target.data.id, 'is links with key', key, 'are undefined');
        return;
      } else {
        var index = object.relationships[key].indexOf(target);

        if (index === -1) {
          // $log.warn(target.data.type + ':' + target.data.id, 'is not linked to', object.data.type + ':' + object.data.id, 'as', key);
          return false;
        } else {
          object.relationships[key].splice(index, 1);
          object.data.relationships[key].data.splice(index, 1);
        }
      }

      return true;
    }

  }
})();
