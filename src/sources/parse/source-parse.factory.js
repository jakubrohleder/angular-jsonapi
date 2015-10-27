(function() {
  'use strict';

  angular.module('angular-jsonapi-parse')
  .factory('AngularJsonAPISourceParse', AngularJsonAPISourceParseWrapper);

  function AngularJsonAPISourceParseWrapper(
    AngularJsonAPIModelSourceError,
    AngularJsonAPISourcePrototype,
    AngularJsonAPIModelLinkerService,
    pluralize,
    Parse,
    $log,
    $q
  ) {

    AngularJsonAPISourceParse.prototype = Object.create(AngularJsonAPISourcePrototype.prototype);
    AngularJsonAPISourceParse.prototype.constructor = AngularJsonAPISourceParse;
    AngularJsonAPISourceParse.prototype.initialize = initialize;

    return {
      create: AngularJsonAPISourceParseFactory
    };

    function AngularJsonAPISourceParseFactory(name, table) {
      return new AngularJsonAPISourceParse(name, table);
    }

    function AngularJsonAPISourceParse(name, table) {
      var _this = this;

      _this.ParseObject = Parse.Object.extend(table);
      _this.type = pluralize(table).charAt(0).toLowerCase() + pluralize(table).slice(1);

      AngularJsonAPISourcePrototype.apply(_this, arguments);

      _this.synchronization('remove', remove);
      _this.synchronization('update', update);
      _this.synchronization('add', update);
      _this.synchronization('all', all);
      _this.synchronization('get', get);
      _this.synchronization('refresh', get);

      function all(config) {
        var query = new Parse.Query(_this.ParseObject);

        if (config.params.limit !== undefined) {
          query.limit(config.params.limit);
        }

        angular.forEach(config.params.filter, function(filter) {
          query.equalTo(filter.key, filter.value);
        });

        return query.find().then(resolveParse, rejectParse.bind(null, 'all'));
      }

      function get(config) {
        var query = new Parse.Query(_this.ParseObject);
        return query.get(config.object.data.id).then(resolveParse, rejectParse.bind(null, 'get'));
      }

      function remove(config) {
        var object = new _this.ParseObject();
        object.set('id', config.object.data.id);
        return object.destroy().then(resolveParse, rejectParse.bind(null, 'remove'));
      }

      function update(config) {
        var object = toParseObject(config.object);
        return object.save(null).then(resolveParse, rejectParse.bind(null, 'update'));
      }

      function toParseObject(object) {
        var parseObject = new _this.ParseObject();
        angular.forEach(object.form.data.attributes, function(attribute, key) {
          parseObject.set(key, attribute);
        });

        angular.forEach(object.schema.relationships, function(relationship, key) {
          if (relationship.type === 'hasOne'
            && object.form.data.relationships[key].data !== null
            && object.form.data.relationships[key].data !== undefined
          ) {
            var table = pluralize(key, 1).charAt(0).toUpperCase() + pluralize(key, 1).slice(1);
            var parsePointer = new (Parse.Object.extend(table))();
            parsePointer.set('id', object.form.data.relationships[key].data.id);
            parseObject.set(key, parsePointer);
          }
        });

        return parseObject;
      }

      function fromParseObject(object) {
        var relationships = _this.synchronizer.resource.schema.relationships;
        object.type = _this.type;
        object.relationships = object.relationships || [];
        angular.forEach(relationships, function(relationship, key) {
          if (object.attributes[key] && relationship.type === 'hasOne') {
            object.relationships[key] = {
              data: {
                type: relationship.model,
                id: object.attributes[key].id
              }
            };
          }
        });

        return object;
      }

      function resolveParse(response) {
        if (angular.isArray(response)) {
          angular.forEach(response, function(elem, key) {
            response[key] = fromParseObject(elem);
          });
        } else if (angular.isObject(response)) {
          response = fromParseObject(response);
        }

        return $q.resolve({
          data: response
        });
      }

      function rejectParse(action, response) {
        $log.error('Parse error for', action, response);
        return $q.reject(response);
      }
    }

    function initialize(appId, jsKey) {
      Parse.initialize(appId, jsKey);
    }
  }
})();
