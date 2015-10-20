(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPISchema', AngularJsonAPISchemaWrapper);

  function AngularJsonAPISchemaWrapper(
    $log,
    pluralize,
    uuid4,
    AngularJsonAPISchemaLink
  ) {

    return {
      create: AngularJsonAPISchemaFactory
    };

    function AngularJsonAPISchemaFactory(schema) {
      return new AngularJsonAPISchema(schema);
    }

    function AngularJsonAPISchema(schema) {
      var _this = this;
      var include = schema.include || {};
      schema.include = include;
      include.get = schema.include.get || [];
      include.all = schema.include.all || [];

      _this.params = {
        get: {},
        all: {}
      };

      if (schema.id === 'uuid4') {
        schema.id = uuid4;
      } else if (schema.id === 'int') {
        schema.id = {
          generate: angular.noop,
          validate: angular.isNumber
        };
      } else if (angular.isObject(schema.id)) {
        if (!angular.isFunction(schema.id.generate)) {
          schema.id.generate = angular.noop;
        }
      } else {
        schema.id = {
          generate: angular.noop,
          validate: angular.identity.bind(null, true)
        };
      }

      angular.forEach(schema.relationships, function(linkSchema, linkName) {
        var linkSchemaObj = AngularJsonAPISchemaLink.create(linkSchema, linkName, schema.type);
        schema.relationships[linkName] = linkSchemaObj;
        if (linkSchemaObj.included === true) {
          include.get.push(linkName);
          if (linkSchemaObj.type === 'hasOne') {
            include.all.push(linkName);
          }
        }
      });

      angular.extend(_this, schema);

      if (include.get.length > 0) {
        _this.params.get.include = include.get;
      }

      if (include.all.length > 0) {
        _this.params.all.include = include.all;
      }
    }

  }
})();
