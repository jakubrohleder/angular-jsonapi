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
        return false;
      }

      if (object === undefined) {
        $log.error('Can\'t add link to non existing object', object, key, target, schema);
        return false;
      }

      if (schema === undefined) {
        $log.error('Can\'t add link not present in schema: ', object, key, target, schema);
        return false;
      }

      if (target !== null && schema.polymorphic === false && schema.model !== target.data.type) {
        $log.error('This relation is not polymorphic, expected: ' + schema.model + ' instead of ' + target.data.type);
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
        return __removeHasMany(_this, key, object, schema);
      } else if (schema.type === 'hasOne') {
        return __removeHasOne(_this, key, object, schema);
      }
    }

    /////////////
    // Private //
    /////////////

    function __addHasOne(object, key, target, schema) {
      $log.log('addHasOne', object);

      if (object.relationships[key] === target) {
        $log.warn(object, 'is already linked to', target);
        return false;
      } else {
        object.relationships[key] = target;
        object.data.relationships[key].data = toLinkData(target);
      }

      return true;
    }

    function __addHasMany(object, key, target, schema) {
      $log.log('addHasMany', object, key, target, schema);

      if (object.relationships[key].indexOf(target) > -1) {
        $log.warn(object, 'is already linked to', target);
        return false;
      } else {
        object.relationships[key].push(target);
        object.data.relationships[key].data.push(toLinkData(target));
      }

      return true;
    }

    function __removeHasOne(object, key, target, schema) {
      $log.log('removeHasOne', object, key, target, schema);

      if (target !== undefined && object.relationships[key] !== target) {
        $log.warn(object, 'is not linked to', target);
        return false;
      } else {
        object.relationships[key] = null;
        object.data.relationships[key].data = undefined;
      }

      return true;
    }

    function __removeHasMany(object, key, target, schema) {
      $log.log('removeHasMany', object, key, target, schema);

      if (target === undefined) {
        object.relationships[key] = [];
        object.data.relationships[key].data = [];
      } else {
        var index = object.relationships[key].indexOf(target);

        if (index === -1) {
          $log.warn(object, 'is not linked to', target);
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
