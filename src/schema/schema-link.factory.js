(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPISchemaLink', AngularJsonAPILinkSchrapperLink);

  function AngularJsonAPILinkSchrapperLink($log, pluralize) {

    return {
      create: AngularJsonAPISchemaLinkFactory
    };

    function AngularJsonAPISchemaLinkFactory(linkSchema, linkName, type) {
      return new AngularJsonAPISchemaLink(linkSchema, linkName, type);
    }

    function AngularJsonAPISchemaLink(linkSchema, linkName, type) {
      var _this = this;

      if (angular.isString(linkSchema)) {
        _this.model = pluralize.plural(linkName);
        _this.type = linkSchema;
        _this.polymorphic = false;
        _this.reflection = type;
      } else {
        if (linkSchema.type === undefined) {
          $log.error('Schema of link without a type: ', linkSchema, linkName);
        }

        if (linkSchema.type !== 'hasMany' && linkSchema.type !== 'hasOne') {
          $log.error('Schema of link with wrong type: ', linkSchema.type, 'available: hasOne, hasMany');
        }

        _this.model = linkSchema.model || pluralize.plural(linkName);
        _this.type = linkSchema.type;
        _this.polymorphic = linkSchema.polymorphic || false;

        if (linkSchema.reflection === undefined) {
          _this.reflection = _this.type === 'hasMany' ? pluralize.singular(type) : type;
        } else {
          _this.reflection = linkSchema.reflection;
        }

        _this.included = linkSchema.included || false;
      }
    }

  }
})();
