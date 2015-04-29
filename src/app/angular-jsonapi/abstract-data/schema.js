(function() {
  'use strict';

  angular.module('angularJsonapi')
  .factory('AngularJsonAPISchema', AngularJsonAPISchemaWrapper);

  function AngularJsonAPISchemaWrapper($log) {

    return AngularJsonAPISchema;

    function AngularJsonAPISchema(schema) {
      var _this = this;

      angular.forEach(schema.links, function(linkSchema, linkName) {
        schema.links[linkName] = new AngularJsonAPILinkSchema(linkSchema, linkName, schema.type);
      });

      angular.extend(_this, schema);
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
      }
    }

  }
})();
