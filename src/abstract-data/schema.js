(function() {
  'use strict';

  angular.module('angularJsonapi')
  .factory('AngularJsonAPISchema', AngularJsonAPISchemaWrapper);

  function AngularJsonAPISchemaWrapper($log) {

    return AngularJsonAPISchema;

    function AngularJsonAPISchema(schema) {
      var _this = this;
      var include = [];

      _this.params = {
        get: {},
        all: {}
      };

      angular.forEach(schema.relationships, function(linkSchema, linkName) {
        var linkSchemaObj = new AngularJsonAPILinkSchema(linkSchema, linkName, schema.type);
        schema.relationships[linkName] = linkSchemaObj;
        if (linkSchemaObj.included === true) {
          include.push(linkName);
        }
      });

      angular.extend(_this, schema);

      if (include.length > 0) {
        _this.params.get.include = include.join(',');
      }
    }

    function AngularJsonAPILinkSchema(linkSchema, linkName, type) {
      var _this = this;

      if (angular.isString(linkSchema)) {
        _this.model = linkName;
        _this.type = linkSchema;
        _this.polymorphic = false;
        _this.reflection = type;
      } else {
        if (linkSchema.type === undefined) {
          $log.error('Schema of link without a type: ', linkSchema, linkName);
        }

        _this.model = linkSchema.model || linkName;
        _this.type = linkSchema.type;
        _this.polymorphic = linkSchema.polymorphic || false;
        _this.reflection = linkSchema.reflection || type;
        _this.included = linkSchema.included || false;
      }
    }

  }
})();
