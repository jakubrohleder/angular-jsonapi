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
    function link(object, key, target, oneWay, form) {
      var schema;
      form = form === undefined ? false : form;

      if (object === undefined) {
        $log.error('Can\'t add link to non existing object', object, key, target);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        return [];
      }

      schema = object.schema.relationships[key];

      if (target === undefined) {
        $log.error('Can\'t link non existing object', object, key, target, schema);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        $log.error('Schema:', schema);
        return [];
      }

      if (schema === undefined) {
        $log.error('Can\'t add link not present in schema:', object, key, target, schema);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        $log.error('Schema:', schema);
        return [];
      }

      if (target !== null && schema.polymorphic === false && schema.model !== target.data.type) {
        $log.error('This relation is not polymorphic, expected: ' + schema.model + ' instead of ' + target.data.type);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        $log.error('Schema:', schema);
        return [];
      }

      if (schema.type === 'hasMany') {
        if (oneWay === true) {
          __addHasMany(object, key, target, form);
          return [];
        } else {
          return __processAddHasMany(object, key, target, form);
        }
      } else if (schema.type === 'hasOne') {
        if (oneWay === true) {
          __addHasOne(object, key, target, form);
          return [];
        } else {
          return __processAddHasOne(object, key, target, form);
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
    function unlink(object, key, target, oneWay, form) {
      var schema;
      form = form === undefined ? false : form;

      if (object === undefined) {
        $log.error('Can\'t remove link from non existing object', object, key, target);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        return [];
      }

      schema = object.schema.relationships[key];

      if (schema === undefined) {
        $log.error('Can\'t remove link not present in schema:', object, key, target, schema);
        $log.error('Object:', object.data.type, object);
        $log.error('Target:', target.data.type, target);
        $log.error('Key:', key);
        $log.error('Schema:', schema);
        return [];
      }

      if (oneWay === true) {
        __removeHasMany(object, key, target, form);
        return [];
      } else {
        return __processRemove(object, key, target, form);
      }
    }

    /////////////
    // Private //
    /////////////

    function __processAddHasMany(object, key, target, form) {
      var reflectionKey = object.schema.relationships[key].reflection;
      var reflectionSchema;

      if (reflectionKey === false) {
        __addHasMany(object, key, target, form);
        return [];
      }

      reflectionSchema = target.schema.relationships[reflectionKey];

      if (reflectionSchema === undefined) {
        $log.error('Cannot find reflection of', key, 'relationship for', object.data.type, 'in', target.data.type);
        $log.error('For one side relationships set schema.reflection to false');
        return [];
      } else if (reflectionSchema.type === 'hasOne') {
        return __swapResults(
          __wrapResults(object, key, target),
          __wrapResults(target, reflectionKey, object),
          __processAddHasOne(target, reflectionKey, object, form)
        );
      } else if (reflectionSchema.type === 'hasMany') {
        __addHasMany(object, key, target, form);
        __addHasMany(target, reflectionKey, object, form);
        return [__wrapResults(target, reflectionKey, object)];
      }
    }

    function __processAddHasOne(object, key, target, form) {
      var reflectionKey = object.schema.relationships[key].reflection;
      var oldReflection = object.relationships[key];
      var reflectionSchema;
      var oldReflectionSchema;
      var result = [];

      __addHasOne(object, key, target, form);

      if (reflectionKey === false) {
        return [];
      }

      if (oldReflection !== undefined && oldReflection !== null) {
        oldReflectionSchema = oldReflection.schema.relationships[reflectionKey];

        if (oldReflectionSchema !== undefined) {
          if (oldReflectionSchema.type === 'hasOne') {
            __removeHasOne(oldReflection, reflectionKey, object, form);
          } else if (oldReflectionSchema.type === 'hasMany') {
            __removeHasMany(oldReflection, reflectionKey, object, form);
          }

          result.push(__wrapResults(oldReflection, reflectionKey, object));
        } else {
          $log.error('Cannot find reflection of', key, 'relationship for', object.data.type, 'in', target.data.type);
          $log.error('For one side relationships set schema.reflection to false');
        }
      }

      if (target !== undefined && target !== null && reflectionKey !== false) {
        reflectionSchema = target.schema.relationships[reflectionKey];
        if (reflectionSchema !== undefined) {
          if (reflectionSchema.type === 'hasOne') {
            __addHasOne(target, reflectionKey, object, form);
          } else if (reflectionSchema.type === 'hasMany') {
            __addHasMany(target, reflectionKey, object, form);
          }

          result.push(__wrapResults(target, reflectionKey, object));
        } else {
          $log.error('Cannot find reflection of', key, 'relationship for', object.data.type, 'in', target.data.type);
          $log.error('For one side relationships set schema.reflection to false');
        }
      }

      return result;
    }

    function __processRemove(object, key, target, form) {
      var schema = object.schema.relationships[key];
      var reflectionKey = schema.reflection;
      var reflectionSchema;

      if (schema.type === 'hasMany') {
        __removeHasMany(object, key, target, form);
      } else if (schema.type === 'hasOne') {
        __removeHasOne(object, key, target, form);
      }

      if (reflectionKey === false) {
        return [];
      }

      reflectionSchema = target.schema.relationships[reflectionKey];

      if (reflectionSchema !== undefined) {
        if (reflectionSchema.type === 'hasOne') {
          __removeHasOne(target, reflectionKey, object, form);
        } else if (reflectionSchema.type === 'hasMany') {
          __removeHasMany(target, reflectionKey, object, form);
        }
      } else {
        $log.error('Cannot find reflection of', key, 'relationship for', object.data.type, 'in', target.data.type);
        $log.error('For one side relationships set schema.reflection to false');
        return [];
      }

      return [__wrapResults(target, reflectionKey, object)];
    }

    function __addHasOne(object, key, target, form) {
      $log.debug('addHasOne', object, key, target);

      if (form === true) {
        object = object.form;
      }

      object.relationships[key] = target;
      object.data.relationships[key].data = toLinkData(target);

      if (form === false) {
        object.reset(true);
      }

      return true;
    }

    function __addHasMany(object, key, target, form) {
      $log.debug('addHasMany', object, key, target);

      var linkData = toLinkData(target);
      if (form === true) {
        object = object.form;
      }

      if (angular.isArray(object.relationships[key]) && object.relationships[key].indexOf(target) > -1) {
        return false;
      }

      object.relationships[key] = object.relationships[key] || [];
      object.data.relationships[key].data = object.data.relationships[key].data || [];

      object.relationships[key].push(target);
      object.data.relationships[key].data.push(linkData);

      if (form === false) {
        object.reset(true);
      }

      return true;
    }

    function __removeHasOne(object, key, target, form) {
      $log.debug('removeHasOne', object, key, target);

      if (form === true) {
        object = object.form;
      }

      if (target !== undefined && object.relationships[key] !== target) {
        return false;
      }

      object.relationships[key] = null;
      object.data.relationships[key].data = undefined;

      if (form === false) {
        object.reset(true);
      }

      return true;
    }

    function __removeHasMany(object, key, target, form) {
      $log.debug('removeHasMany', object, key, target);

      if (form === true) {
        object = object.form;
      }

      if (object.relationships[key] === undefined) {
        return;
      }

      if (target === undefined) {
        object.relationships[key] = [];
        object.data.relationships[key].data = [];
        if (form === false) {
          object.reset(true);
        }

        return true;
      }

      var index = object.relationships[key].indexOf(target);

      if (index === -1) {
        return false;
      }

      object.relationships[key].splice(index, 1);
      object.data.relationships[key].data.splice(index, 1);

      if (form === false) {
        object.reset(true);
      }

      return true;
    }

    function __wrapResults(object, key, target) {
      return {
        object: object,
        key: key,
        target: target
      };
    }

    function __swapResults(value, newValue, array) {
      var index = -1;
      angular.forEach(array, function(item, i) {
        if (item.object === value.object && item.key === value.key && item.target === value.target) {
          index = i;
        }
      });

      if (index > -1) {
        array[index] = newValue;
      } else {
        array.push(newValue);
      }

      return array;
    }
  }
})();
