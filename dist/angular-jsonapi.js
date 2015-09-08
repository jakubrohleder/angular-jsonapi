(function() {
  'use strict';

  angular.module('angular-jsonapi', ['uuid4'])
  /* global pluralize: false */
  .constant('pluralize', pluralize);
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .service('AngularJsonAPIModelValidatorService', AngularJsonAPIModelValidatorService);

  function AngularJsonAPIModelValidatorService() {
    var _this = this;
    _this.validateForm = validateForm;
    _this.validateField = validateField;

    return this;

    /**
     * Validates form
     * @param  {object} data Form data
     * @return {object} Errors object indexed by keys
     */
    function validateForm(schema, data) {
      var _this = this;

      return {};
    }

    /**
     * Validates single field
     * @param  {string} key Field key
     * @return {array}     Errors array
     */
    function validateField(schema, key) {
      var _this = this;

      return [];
    }

    // function __validate(validator, attributeValue, attributeName) {
    //   var errors = [];
    //   if (angular.isArray(validator)) {
    //     angular.forEach(validator, function(element) {
    //       errors = errors.concat(__validate(element, attributeValue, attributeName));
    //     });
    //   } else if (angular.isFunction(validator)) {
    //     var err = validator(attributeValue, attributeName);
    //     if (angular.isArray(err)) {
    //       errors.concat(err);
    //     } else {
    //       $log.error(
    //         'Wrong validator type it should return array of errors instead of: ' +
    //           err.toString()
    //       );
    //     }
    //   } else if (angular.isString(validator)) {
    //     if (validator === 'text' || validator === 'string') {
    //       if (!angular.isString(attributeValue)) {
    //         errors.push(attributeName + ' is not a string ');
    //       }
    //     } else if (validator === 'number' || validator === 'integer') {
    //       if (parseInt(attributeValue).toString() !== attributeValue.toString()) {
    //         errors.push(attributeName + ' is not a number');
    //       }
    //     } else if (validator === 'uuid4') {
    //       if (!uuid4.validate(attributeValue)) {
    //         errors.push(attributeName + ' is not a uuid4');
    //       }
    //     } else if (validator === 'required') {
    //       if (attributeValue.toString().length === 0) {
    //         errors.push(attributeName + ' is empty');
    //       }
    //     } else {
    //       $log.error('Wrong validator type: ' + validator.toString());
    //     }
    //   } else if (angular.isObject(validator)) {
    //     if (validator.maxlength !== undefined && attributeValue.length > validator.maxlength) {
    //       errors.push(attributeName + ' is too long max ' + validator.maxlength);
    //     }

    //     if (validator.minlength !== undefined && attributeValue.length < validator.minlength) {
    //       errors.push(attributeName + ' is too short min ' + validator.minlength);
    //     }

    //     if (validator.maxvalue !== undefined && parseInt(attributeValue) > validator.maxvalue) {
    //       errors.push(attributeName + ' is too big max ' + validator.maxvalue);
    //     }

    //     if (validator.minvalue !== undefined && parseInt(attributeValue) < validator.minvalue) {
    //       errors.push(attributeName + ' is too small min ' + validator.minvalue);
    //     }
    //   } else {
    //     $log.error('Wrong validator type: ' + validator.toString());
    //   }

    //   return errors;
    // }
  }
})();

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
        // $log.warn(target.data.type + ':' + target.data.id, 'is already linked to', object.data.type + ':' + object.data.id, 'as', key);
        return false;
      } else {
        object.relationships[key] = object.relationships[key] || [];
        object.relationships[key].push(target);
        object.data.relationships[key].data = object.data.relationships[key].data || [];
        object.data.relationships[key].data.push(linkData);
      }

      return true;
    }

    function __removeHasOne(object, key, target, schema) {
      $log.debug('removeHasOne', object, key, target, schema);

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
        // $log.warn(target.data.type + ':' + target.data.id, 'is links with key', key, 'are undefined');
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
  AngularJsonAPIModelLinkerService.$inject = ["$log"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModelForm', AngularJsonAPIModelFormWrapper);

  function AngularJsonAPIModelFormWrapper(
    AngularJsonAPIModelValidatorService,
    AngularJsonAPIModelLinkerService
  ) {

    AngularJsonAPIModelForm.prototype.save = save;
    AngularJsonAPIModelForm.prototype.reset = reset;
    AngularJsonAPIModelForm.prototype.validate = validate;
    AngularJsonAPIModelForm.prototype.validateField = validateField;

    AngularJsonAPIModelForm.prototype.link = link;
    AngularJsonAPIModelForm.prototype.unlink = unlink;

    AngularJsonAPIModelForm.prototype.toJson = toJson;

    return AngularJsonAPIModelForm;

    function AngularJsonAPIModelForm(parent) {
      var _this = this;

      _this.data = {
        id: parent.data.id,
        type: parent.data.type,
        attributes: {},
        relationships: {}
      };

      _this.relationships = {};
      _this.parent = parent;
      _this.schema = parent.schema;
      _this.reset();
    }

    /**
     * Encodes object into json
     * @return {json} Json object
     */
    function toJson() {
      var _this = this;
      var data = angular.copy(_this.data);
      var relationships = {};

      angular.forEach(data.relationships, function(value, key) {
        if (value.data !== undefined) {
          relationships[key] = value;
        }
      });

      data.relationships = relationships;

      return {
        data: data
      };
    }

    /**
     * Saves form, shortcut to parent.save()
     * @return {promise} Promise associated with synchronization
     */
    function save() {
      var _this = this;

      return _this.parent.save();
    }

    /**
     * Resets form to state of a parent
     * @return {undefined}
     */
    function reset() {
      var _this = this;

      angular.forEach(_this.schema.attributes, function(validator, key) {
        _this.data.attributes[key] = _this.parent.data.attributes[key] || '';
      });

      angular.forEach(_this.schema.relationships, function(data, key) {
        _this.data.relationships[key] = _this.parent.data.relationships[key] || {};
        _this.relationships[key] = _this.parent.relationships[key];
      });

      _this.errors = {
        validation: {}
      };
    }

    /**
     * Validates form
     * @return {objec} Errors object indexed by keys
     */
    function validate() {
      var _this = this;
      var errors;

      errors = AngularJsonAPIModelValidatorService.validateForm(_this.data);

      _this.errors.validation = errors;

      return errors;
    }

    /**
     * Validates single field
     * @param  {string} key Field key
     * @return {array}     Errors array
     */
    function validateField(key) {
      var _this = this;
      var errors;
      errors = AngularJsonAPIModelValidatorService.validateField(
        _this.data[key],
        key
      );

      _this.errors.validation[key] = errors;

      return errors;
    }

    /**
     * Adds link to a form without synchronization
     * @param {string} key    Relationship name
     * @param {AngularJsonAPIModel} target Object to be linked
     * @return {Boolean}        Status
     */
    function link(key, target) {
      var _this = this;
      var schema = _this.schema.relationships[key];

      return AngularJsonAPIModelLinkerService.link(_this, key, target, schema);
    }

    /**
     * Removes link from form without synchronization
     * @param  {[type]} key    Relationship name
     * @param {AngularJsonAPIModel} target Object to be linked
     * @return {Boolean}        Status
     */
    function unlink(key, target) {
      var _this = this;
      var schema = _this.schema.relationships[key];

      return AngularJsonAPIModelLinkerService.unlink(_this, key, target, schema);
    }
  }
  AngularJsonAPIModelFormWrapper.$inject = ["AngularJsonAPIModelValidatorService", "AngularJsonAPIModelLinkerService"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIAbstractModel', AngularJsonAPIAbstractModelWrapper);

  function AngularJsonAPIAbstractModelWrapper(
    AngularJsonAPIModelForm,
    AngularJsonAPIModelLinkerService,
    uuid4,
    $rootScope,
    $injector,
    $log,
    $q
  ) {
    AngularJsonAPIAbstractModel.prototype.refresh = refresh;
    AngularJsonAPIAbstractModel.prototype.remove = remove;
    AngularJsonAPIAbstractModel.prototype.reset = reset;
    AngularJsonAPIAbstractModel.prototype.save = save;

    AngularJsonAPIAbstractModel.prototype.update = update;

    AngularJsonAPIAbstractModel.prototype.link = link;
    AngularJsonAPIAbstractModel.prototype.unlink = unlink;
    AngularJsonAPIAbstractModel.prototype.unlinkAll = unlinkAll;

    AngularJsonAPIAbstractModel.prototype.toJson = toJson;

    return AngularJsonAPIAbstractModel;

    /**
     * Constructor
     * @param {json}  data      Validated data used to create an object
     * @param {Boolean} saved   Is object new (for form)
     */
    function AngularJsonAPIAbstractModel(data, saved, stable) {
      var _this = this;

      data.relationships = data.relationships || {};

      _this.saved = saved || true;
      _this.stable = stable || true;
      _this.synchronized = false;

      _this.removed = false;
      _this.loadingCount = 0;

      _this.data = {
        relationships: {},
        attributes: {}
      };
      _this.relationships = {};

      angular.forEach(_this.schema.relationships, function(schema, name) {
        _this.relationships[name] = undefined;
      });

      _this.errors = {
        validation: {}
      };

      _this.promises = {};

      __setData(_this, data);

      _this.form = new AngularJsonAPIModelForm(_this);
    }

    /**
     * Saves model's form
     * @return {promise} Promise associated with synchronization that resolves to this
     */
    function save() {
      var _this = this;
      var deferred = $q.defer();
      var hasErrors = false;
      var config = {
        action: 'update',
        object: _this
      };

      if (_this.saved === false) {
        config.action = 'add';
      }

      var errors = _this.form.validate();

      for (var error in errors) {
        if (errors.hasOwnProperty(error)) {
          hasErrors = true;
        }
      }

      if (hasErrors === true) {
        deferred.reject(errors);
      } else {
        _this.synchronize(config).then(resolve, reject, notify);
      }

      return deferred.promise;

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:save', 'resolved', _this, response);
        _this.update(_this.form.data);

        response.finish();

        deferred.resolve(_this);
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:save', 'rejected', _this, response);
        response.finish();

        deferred.reject(response.errors);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:save', 'notify', _this, response);

        deferred.notify(response.errors);
      }
    }

    /**
     * Reset object form
     * @return {undefined}
     */
    function reset() {
      var _this = this;

      return _this.form.reset();
    }

    /**
     * Synchronize object with remote
     * @return {promise} Promise associated with synchronization that resolves to this
     */
    function refresh() {
      var $jsonapi = $injector.get('$jsonapi');
      var deferred = $q.defer();
      var _this = this;
      var config = {
        action: 'refresh',
        object: _this,
        params: _this.schema.params.get
      };

      if (_this.saved === false) {
        $log.error('Can\'t refresh new object');
        deferred.reject('Can\'t refresh new object');
      } else {
        _this.synchronize(config).then(resolve, reject, notify);
      }

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:refresh', 'resolved', _this, response);
        $jsonapi.proccesResults(response.data);
        response.finish();

        _this.synchronized = true;
        _this.stable = true;

        deferred.resolve(response);
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:refresh', 'rejected', _this, response);
        response.finish();

        deferred.reject(response);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:refresh', 'notify', _this, response);

        deferred.notify(response);
      }

      return deferred.promise;
    }

    /**
     * Encodes object into json
     * @return {json} Json object
     */
    function toJson() {
      var _this = this;
      var data = angular.copy(_this.data);
      var relationships = {};

      angular.forEach(data.relationships, function(value, key) {
        if (value.data !== undefined) {
          relationships[key] = value;
        }
      });

      data.relationships = relationships;

      return {
        data: data
      };
    }

    /**
     * Remove object
     * @return {promise} Promise associated with synchronization that resolves to nothing
     */
    function remove() {
      var _this = this;
      var deferred = $q.defer();

      var config = {
        action: 'remove',
        object: _this
      };

      _this.parentFactory.cache.remove(_this.data.id);

      if (_this.saved === false) {
        deferred.resolve();
      } else {
        _this.synchronize(config).then(resolve, reject, notify);
      }

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:remove', 'resolved', _this, response);
        _this.removed = true;
        _this.unlinkAll();
        _this.parentFactory.cache.clearRemoved(_this.data.id);
        response.finish();

        deferred.resolve(response);
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:remove', 'rejected', _this, response);
        _this.parentFactory.cache.revertRemove(_this.data.id);
        response.finish();

        deferred.reject(response);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:remove', 'notify', _this, response);

        deferred.notify(response);
      }

      return deferred.promise;
    }

    /**
     * Unlink all reflection relationships of the object **without synchronization**
     * @return {boolean} Result
     */
    function unlinkAll(key) {
      var _this = this;
      var deferred = $q.defer();

      if (key === undefined) {
        angular.forEach(_this.relationships, removeLink);
      } else {
        removeLink(_this.relationships[key], key);
      }

      return deferred.promise;

      function removeLink(linksObj, key) {
        var schema = _this.schema.relationships[key];
        var reflectionKey = schema.reflection;

        if (angular.isArray(linksObj)) {
          angular.forEach(linksObj, removeReflectionLink.bind(undefined, reflectionKey));
        } else if (angular.isObject(linksObj)) {
          removeReflectionLink(reflectionKey, linksObj);
        }

        if (schema.type === 'hasOne') {
          _this.relationships[key] = null;
        } else if (schema.type === 'hasMany') {
          _this.relationships[key] = [];
        }
      }

      function removeReflectionLink(reflectionKey, target) {
        var reflectionSchema = target.schema.relationships[reflectionKey];
        AngularJsonAPIModelLinkerService.unlink(target, reflectionKey, _this, reflectionSchema);

        target.synchronize({
          action: 'unlinkReflection',
          object: target,
          target: _this,
          key: reflectionKey
        }).then(resolve, reject, notify);

        function resolve(response) {
          $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlinkReflection', 'resolve', _this, response);

          response.finish();
          deferred.resolve(_this);
        }

        function reject(response) {
          $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlinkReflection', 'rejected', _this, response);

          response.finish();
          deferred.reject(response);
        }

        function notify(response) {
          $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlinkReflection', 'notify', _this, response);

          response.finish();
          deferred.notify(response);
        }
      }
    }

    /**
     * Links object to relationship with the key
     * @param  {string} key    Relationship name
     * @param  {AngularJsonAPIModel} target Object to be linked
     * @return {promise}        Promise associated with synchronizations
     */
    function link(key, target) {
      var deferred = $q.defer();
      var _this = this;
      var schema = _this.schema.relationships[key];
      var reflectionKey = schema.reflection;

      if (target === undefined) {
        deferred.reject({errors: [{status: 0, statusText: 'Can\'t link undefined'}]});
        return deferred.promise;
      }

      var reflectionSchema = target.schema.relationships[reflectionKey];

      _this.synchronize({
        action: 'link',
        object: _this,
        schema: schema,
        target: target,
        key: key
      }).then(resolve, reject, notify);

      return deferred.promise;

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:link', 'resolved', _this, response);

        AngularJsonAPIModelLinkerService.link(_this, key, target, schema);
        AngularJsonAPIModelLinkerService.link(target, reflectionKey, _this, reflectionSchema);

        _this.stable = true;
        response.finish();

        target.synchronize({
          action: 'linkReflection',
          schema: reflectionSchema,
          object: target,
          target: _this,
          key: reflectionKey
        }).then(resolveReflection, rejectReflection, notifyReflection);

        function resolveReflection(response) {
          $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:linkReflection', 'resolve', _this, response);

          response.finish();
          deferred.resolve(_this);
        }

        function rejectReflection(response) {
          $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:linkReflection', 'rejected', _this, response);

          response.finish();
          deferred.reject(response);
        }

        function notifyReflection(response) {
          $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:linkReflection', 'notify', _this, response);

          response.finish();
          deferred.notify(response);
        }
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:link', 'rejected', _this, response);

        deferred.reject(response.errors);
        response.finish();
        deferred.reject(response);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:link', 'notify', _this, response);

        deferred.notify(response);
      }
    }

    /**
     * Unlinks object from relationship with the key
     * @param  {string} key    Relationship name
     * @param  {AngularJsonAPIModel} target Object to be unlinked if undefined unlinks all
     * @return {promise}        Promise associated with synchronizations
     */
    function unlink(key, target) {
      var deferred = $q.defer();
      var _this = this;
      var schema = _this.schema.relationships[key];
      var reflectionKey = schema.reflection;

      if (target === undefined) {
        deferred.reject({errors: [{status: 0, statusText: 'Can\'t unlink undefined'}]});
        return deferred.promise;
      }

      var reflectionSchema = target.schema.relationships[reflectionKey];

      _this.synchronize({
        action: 'unlink',
        object: _this,
        target: target,
        schema: schema,
        key: key
      }).then(resolve, reject, notify);

      return deferred.promise;

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlink', 'resolved', _this, response);

        AngularJsonAPIModelLinkerService.unlink(_this, key, target, schema);
        AngularJsonAPIModelLinkerService.unlink(target, reflectionKey, _this, reflectionSchema);

        _this.stable = true;
        response.finish();

        target.synchronize({
          action: 'unlinkReflection',
          object: target,
          target: _this,
          schema: reflectionSchema,
          key: reflectionKey
        }).then(resolveReflection, rejectReflection, notifyReflection);

        function resolveReflection(response) {
          $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlinkReflection', 'resolve', _this, response);

          response.finish();
          deferred.resolve(_this);
        }

        function rejectReflection(response) {
          $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlinkReflection', 'rejected', _this, response);

          response.finish();
          deferred.reject(response);
        }

        function notifyReflection(response) {
          $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlinkReflection', 'notify', _this, response);

          response.finish();
          deferred.notify(response);
        }
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlink', 'rejected', _this, response);

        deferred.reject(response.errors);
        response.finish();
        deferred.reject(response);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlink', 'notify', _this, response);

        deferred.notify(response);
      }
    }

    /**
     * Sets object state to data
     * @param  {object} validatedData JsonAPI object with data
     * @return {bool}               Result
     */
    function update(validatedData) {
      var _this = this;

      if (__setData(_this, validatedData) === true) {
        _this.reset();
        _this.synchronized = true;
        _this.updatedAt = Date.now();

        return true;
      } else {
        return false;
      }
    }

    /////////////
    // PRIVATE //
    /////////////

    /**
     * Low level set data function, use only with validated data
     * @param  {AngularJsonAPIModel} object        object to be modified
     * @param  {object} validatedData Validated data
     * @return {boolean}               Status
     */
    function __setData(object, validatedData) {

      var $jsonapi = $injector.get('$jsonapi');
      var schema = object.schema;

      object.data.id = validatedData.id;
      object.data.type = validatedData.type;

      if (object.parentFactory.schema.type !== validatedData.type) {
        $log.error('Different type then factory', object.parentFactory.schema.type, validatedData);
        return false;
      }

      if (!uuid4.validate(object.data.id)) {
        $log.error('Invalid id');
        return false;
      }

      validatedData.attributes = validatedData.attributes || {};
      validatedData.relationships = validatedData.relationships || {};

      angular.forEach(schema.attributes, setAttributes);
      angular.forEach(schema.relationships, setRelationships);

      return true;

      function setAttributes(validators, key) {
        object.data.attributes[key] = validatedData.attributes[key];
      }

      function setRelationships(schema, key) {
        var relationshipData = validatedData.relationships[key];

        if (relationshipData === undefined) {
          object.data.relationships[key] = {data: undefined};
          return;
        }

        object.data.relationships[key] = object.data.relationships[key] || {};
        object.data.relationships[key].links = relationshipData.links;

        if (schema.type === 'hasOne') {
          linkOne(object, key, schema, relationshipData.data);
        } else if (schema.type === 'hasMany') {
          if (angular.isArray(relationshipData.data) && relationshipData.data.length === 0) {
            object.data.relationships[key].data = [];
            object.unlinkAll(key);
          } else {
            angular.forEach(
              relationshipData.data,
              linkOne.bind(undefined, object, key, schema)
            );
          }
        }
      }

      function linkOne(object, key, schema, data) {
        if (data === null) {
          AngularJsonAPIModelLinkerService.link(object, key, null, schema);
          return;
        }

        if (data === undefined) {
          return;
        }

        var factory = $jsonapi.getFactory(data.type);

        if (factory === undefined) {
          $log.error('Factory not found', data.type, data);
          return;
        }

        var target = factory.cache.get(data.id);
        var reflectionKey = schema.reflection;
        var reflectionSchema = target.schema.relationships[reflectionKey];

        AngularJsonAPIModelLinkerService.link(object, key, target, schema);

        if (reflectionKey !== false) {
          AngularJsonAPIModelLinkerService.link(target, reflectionKey, object, reflectionSchema);
        }
      }
    }
  }
  AngularJsonAPIAbstractModelWrapper.$inject = ["AngularJsonAPIModelForm", "AngularJsonAPIModelLinkerService", "uuid4", "$rootScope", "$injector", "$log", "$q"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPICache', AngularJsonAPICacheWrapper);

  function AngularJsonAPICacheWrapper(
    uuid4,
    $log
  ) {

    AngularJsonAPICache.prototype.get = get;
    AngularJsonAPICache.prototype.index = index;
    AngularJsonAPICache.prototype.setIndexIds = setIndexIds;
    AngularJsonAPICache.prototype.addOrUpdate = addOrUpdate;

    AngularJsonAPICache.prototype.fromJson = fromJson;
    AngularJsonAPICache.prototype.toJson = toJson;
    AngularJsonAPICache.prototype.clear = clear;

    AngularJsonAPICache.prototype.remove = remove;
    AngularJsonAPICache.prototype.revertRemove = revertRemove;
    AngularJsonAPICache.prototype.clearRemoved = clearRemoved;

    return AngularJsonAPICache;

    /**
     * Constructor
     */
    function AngularJsonAPICache(factory) {
      var _this = this;

      _this.factory = factory;
      _this.data = {};
      _this.removed = {};
      _this.size = 0;

      _this.indexIds = [];
    }

    /**
     * Add new model or update existing with data
     * @param {object} validatedData Data that are used to update or create an object, has to be valid
     * @return {AngularJsonAPIModel} Created model
     */
    function addOrUpdate(validatedData, stable) {
      var _this = this;
      var id = validatedData.id;

      if (id === undefined) {
        $log.error('Can\'t add data without id!', validatedData);
        return;
      }

      if (_this.data[id] === undefined) {
        _this.data[id] = new _this.factory.Model(validatedData, true, stable);
        _this.size += 1;
      } else {
        _this.data[id].update(validatedData);
      }

      return _this.data[id];
    }


    /**
     * Recreate object structure from json data
     * @param  {json} json Json data
     * @return {undefined}
     */
    function fromJson(json) {
      var _this = this;
      var collection = angular.fromJson(json);

      if (angular.isObject(collection) && collection.data !== undefined) {
        _this.updatedAt = collection.updatedAt;
        _this.indexIds = collection.indexIds;

        angular.forEach(collection.data, function(objectData) {
          var data = objectData.data;
          _this.addOrUpdate(data, false);
        });
      }
    }

    /**
     * Encodes memory into json format
     * @return {json} Json encoded memory
     */
    function toJson() {
      var _this = this;
      var json = {
        data: {},
        updatedAt: _this.updatedAt,
        indexIds: _this.indexIds
      };

      angular.forEach(_this.data, function(object, key) {
        json.data[key] = object.toJson();
      });

      return angular.toJson(json);
    }

    /**
     * Clear memory
     * @return {undefined}
     */
    function clear() {
      var _this = this;

      _this.data = {};
      _this.removed = {};
    }

    /**
     * Low level get used internally, does not run any synchronization
     * @param  {uuid} id
     * @return {AngularJsonAPIModel} Model associated with id
     */
    function get(id) {
      var _this = this;

      if (_this.data[id] === undefined) {
        _this.data[id] = new _this.factory.Model({id: id, type: _this.factory.Model.prototype.schema.type}, true, false);
      }

      return _this.data[id];
    }

    /**
     * Low level get used internally, does not run any synchronization
     * @param  {objec} params
     * @return {AngularJsonAPIModel} Model associated with id
     */
    function index(params) {
      var _this = this;

      return _this.indexIds.map(_this.get.bind(_this));
    }

    /**
     * Cache ids of objects returned by index request
     * @param {ids array or AngularJsonAPIModel array} array Objects or ids to be cached
     */
    function setIndexIds(array) {
      var _this = this;

      _this.indexIds = [];

      angular.forEach(array, function(element) {
        if (angular.isString(element) && uuid4.validate(element)) {
          _this.indexIds.push(element);
        } else if (angular.isObject(element) && uuid4.validate(element.data.id)) {
          _this.indexIds.push(element.data.id);
        }
      });
    }

    /**
     * Remove object with given id from cache
     * @param  {uuid} id
     * @return {AngularJsonAPIModel / undefined}    Removed object, undefined if
     * object does not exist
     */
    function remove(id) {
      var _this = this;

      if (_this.data[id] !== undefined) {
        _this.removed[id] = _this.data[id];
        delete _this.data[id];
        _this.size -= 1;
      }

      return _this.removed[id];
    }

    /**
     * Revert removal of an object with given id from cache
     * @param  {uuid} id
     * @return {AngularJsonAPIModel / undefined}    Removed object, undefined if
     * object does not exist
     */
    function revertRemove(id) {
      var _this = this;

      if (_this.removed[id] !== undefined) {
        _this.data[id] = _this.removed[id];
        delete _this.removed[id];
        _this.size += 1;
      }

      return _this.data[id];
    }

    /**
     * Clear removed object from memory
     * @param  {uuid} id
     * @return {undefined}
     */
    function clearRemoved(id) {
      var _this = this;

      delete _this.removed[id];
    }
  }
  AngularJsonAPICacheWrapper.$inject = ["uuid4", "$log"];
})();

// from https://www.sitepen.com/blog/2012/10/19/lazy-property-access/
(function() {
  'use strict';

  angular.module('angular-jsonapi')
    .constant('lazyProperty', function(target, propertyName, callback) {
      var result;
      var done;
      Object.defineProperty(target, propertyName, {
        get: function() { // Define the getter
          if (!done) {
            // We cache the result and only compute once.
            done = true;
            result = callback.call(target);
          }

          return result;
        },

        // Keep it enumerable and configurable, certainly not necessary.
        enumerable: true,
        configurable: true
      });
    });

})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
    .constant('toKebabCase', function(str) {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    });

})();

(function() {
  'use strict';

  angular.module('angular-jsonapi').config(['$provide', function($provide) {
    $provide.decorator('$q', ['$delegate', function($delegate) {
      var $q = $delegate;

      $q.allSettled = $q.allSettled || function allSettled(promises, resolvedCallback, rejectedCallback) {
        // Implementation of allSettled function from Kris Kowal's Q:
        // https://github.com/kriskowal/q/wiki/API-Reference#promiseallsettled
        // by Michael Kropat from http://stackoverflow.com/a/27114615/1400432 slightly modified

        var wrapped = angular.isArray(promises) ? [] : {};

        angular.forEach(promises, function(promise, key) {
          if (!wrapped.hasOwnProperty(key)) {
            wrapped[key] = wrap(promise);
          }
        });

        return $q.all(wrapped);

        function wrap(promise) {
          return $q.when(promise)
            .then(function(value) {
              if (angular.isFunction(resolvedCallback)) {
                resolvedCallback(value);
              }

              return { success: true, value: value };
            },

            function(reason) {
              if (angular.isFunction(rejectedCallback)) {
                rejectedCallback(reason);
              }

              return { success: false, reason: reason };
            });
        }
      };

      return $q;
    }]);
  }]);

})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPISynchronizerSimple', AngularJsonAPISynchronizerSimpleWrapper);

  function AngularJsonAPISynchronizerSimpleWrapper(AngularJsonAPISynchronizerPrototype, $q, $log) {

    AngularJsonAPISynchronizerSimple.prototype = Object.create(AngularJsonAPISynchronizerPrototype.prototype);
    AngularJsonAPISynchronizerSimple.prototype.constructor = AngularJsonAPISynchronizerSimple;

    AngularJsonAPISynchronizerSimple.prototype.synchronize = synchronize;

    return AngularJsonAPISynchronizerSimple;

    function AngularJsonAPISynchronizerSimple(synchronizations) {
      var _this = this;

      _this.state = {};

      AngularJsonAPISynchronizerPrototype.call(_this, synchronizations);

      angular.forEach(synchronizations, function(synchronization) {
        synchronization.synchronizer = _this;
      });
    }

    function synchronize(config) {
      var _this = this;
      var promises = [];
      var deferred = $q.defer();
      var action = config.action;

      AngularJsonAPISynchronizerPrototype.prototype.synchronize.call(_this, config);

      angular.forEach(_this.synchronizations, function(synchronization) {
        angular.forEach(synchronization.beginHooks[action], function(hook) {
          deferred.notify({step: 'begin', data: hook.call(_this, config)});
        });
      });

      angular.forEach(_this.synchronizations, function(synchronization) {
        angular.forEach(synchronization.beforeHooks[action], function(hook) {
          deferred.notify({step: 'before', data: hook.call(_this, config)});
        });
      });

      angular.forEach(_this.synchronizations, function(synchronization) {
        angular.forEach(synchronization.synchronizationHooks[action], function(hook) {
          promises.push(hook.call(_this, config));
        });
      });

      $q.allSettled(promises, resolvedCallback, rejectedCallback).then(resolved, rejected);

      function resolvedCallback(value) {
        deferred.notify({step: 'synchronization', data: value});
      }

      function rejectedCallback(reason) {
        deferred.notify({step: 'synchronization', errors: reason});
      }

      function resolved(results) {
        _this.state[action] = _this.state[action] || {};
        _this.state[action].success = true;

        angular.forEach(results, function(result) {
          if (result.success === false) {
            _this.state[action].success = false;
          }
        });

        angular.forEach(_this.synchronizations, function(synchronization) {
          angular.forEach(synchronization.afterHooks[action], function(hook) {
            deferred.notify({step: 'after', errors: hook.call(_this, config, results)});
          });
        });

        var data;
        var errors = [];

        angular.forEach(results, function(result) {
          if (result.success === true) {
            data = result.value;
          } else {
            errors.push(result.reason);
          }
        });

        if (errors.length > 0) {
          deferred.reject({data: data, finish: finish, errors: errors});
        } else {
          deferred.resolve({data: data, finish: finish, errors: errors});
        }
      }

      function finish() {
        angular.forEach(_this.synchronizations, function(synchronization) {
          angular.forEach(synchronization.finishHooks[action], function(hook) {
            deferred.notify({step: 'finish', errors: hook.call(_this, config)});
          });
        });
      }

      function rejected(errors) {
        $log.error('All settled rejected! Something went wrong');

        deferred.reject({finish: angular.noop, errors: errors});
      }

      return deferred.promise;
    }
  }
  AngularJsonAPISynchronizerSimpleWrapper.$inject = ["AngularJsonAPISynchronizerPrototype", "$q", "$log"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPISynchronizerPrototype', AngularJsonAPISynchronizerPrototypeWrapper);

  function AngularJsonAPISynchronizerPrototypeWrapper($log) {

    AngularJsonAPISynchronizerPrototype.prototype.synchronize = synchronize;

    return AngularJsonAPISynchronizerPrototype;

    function AngularJsonAPISynchronizerPrototype(synchronizations) {
      var _this = this;

      _this.synchronizations = synchronizations;
    }

    function synchronize(config) {
      var _this = this;

      $log.debug('Synchro Collection', _this.factory.Model.prototype.schema.type, config);

      if (config.action === undefined) {
        $log.error('Can\'t synchronize undefined action', config);
      }
    }
  }
  AngularJsonAPISynchronizerPrototypeWrapper.$inject = ["$log"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi-rest', ['angular-jsonapi'])
  .factory('AngularJsonAPISynchronizationRest', AngularJsonAPISynchronizationRestWrapper);

  function AngularJsonAPISynchronizationRestWrapper(
    AngularJsonAPISynchronizationPrototype,
    AngularJsonAPIModelLinkerService,
    toKebabCase,
    $q,
    $http
  ) {

    AngularJsonAPISynchronizationRest.prototype = Object.create(AngularJsonAPISynchronizationPrototype.prototype);
    AngularJsonAPISynchronizationRest.prototype.constructor = AngularJsonAPISynchronizationRest;

    return AngularJsonAPISynchronizationRest;

    function AngularJsonAPISynchronizationRest(url) {
      var _this = this;
      var headers = { // jscs:disable disallowQuotedKeysInObjects
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      }; // jscs:enable disallowQuotedKeysInObjects

      AngularJsonAPISynchronizationPrototype.call(_this);

      _this.synchronization('remove', remove);
      _this.synchronization('unlink', unlink);
      _this.synchronization('link', link);
      _this.synchronization('update', update);
      _this.synchronization('add', add);
      _this.synchronization('all', all);
      _this.synchronization('get', get);
      _this.synchronization('refresh', get);

      function all(config) {
        return $http({
          method: 'GET',
          headers: headers,
          url: url,
          params: config.params || {}
        }).then(resolveHttp, rejectHttp);
      }

      function get(config) {
        return $http({
          method: 'GET',
          headers: headers,
          url: url + '/' + config.object.data.id,
          params: config.params || {}
        }).then(resolveHttp, rejectHttp);
      }

      function remove(config) {
        return $http({
          method: 'DELETE',
          headers: headers,
          url: url + '/' + config.object.data.id
        }).then(resolveHttp, rejectHttp);
      }

      function unlink(config) {
        var deferred = $q.defer();

        if (config.object.removed === true) {
          deferred.reject({errors: [{status: 0, statusText: 'Object has been removed'}]});
        } else if (config.target !== undefined && config.target.data.id === undefined) {
          deferred.reject({errors: [{status: 0, statusText: 'Can\'t unlink object without id through rest call'}]});
        } else if (config.schema.type === 'hasOne') {
          $http({
            method: 'DELETE',
            headers: headers,
            url: url + '/' + config.object.data.id + '/relationships/' + config.key
          }).then(resolveHttp, rejectHttp).then(deferred.resolve, deferred.reject);
        } else if (config.schema.type === 'hasMany') {
          if (config.target === undefined) {
            $http({
              method: 'PUT',
              headers: headers,
              data: {data: []},
              url: url + '/' + config.object.data.id + '/relationships/' + config.key
            }).then(resolveHttp, rejectHttp).then(deferred.resolve, deferred.reject);
          } else {
            $http({
              method: 'DELETE',
              headers: headers,
              url: url + '/' + config.object.data.id + '/relationships/' + config.key + '/' + config.target.data.id
            }).then(resolveHttp, rejectHttp).then(deferred.resolve, deferred.reject);
          }
        }

        return deferred.promise;
      }

      function link(config) {
        var deferred = $q.defer();

        if (config.object.removed === true) {
          deferred.reject({errors: [{status: 0, statusText: 'Object has been removed'}]});
        } else if (config.target === undefined || config.target.data.id === undefined) {
          deferred.reject({errors: [{status: 0, statusText: 'Can\'t link object without id through rest call'}]});
        } else if (config.schema.type === 'hasOne') {
          $http({
            method: 'PUT',
            headers: headers,
            data: {data: AngularJsonAPIModelLinkerService.toLinkData(config.target)},
            url: url + '/' + config.object.data.id + '/relationships/' + config.key
          }).then(resolveHttp, rejectHttp).then(deferred.resolve, deferred.reject);
        } else if (config.schema.type === 'hasMany') {
          $http({
            method: 'POST',
            headers: headers,
            data: {data: [AngularJsonAPIModelLinkerService.toLinkData(config.target)]},
            url: url + '/' + config.object.data.id + '/relationships/' + config.key
          }).then(resolveHttp, rejectHttp).then(deferred.resolve, deferred.reject);
        }

        return deferred.promise;
      }

      function update(config) {
        return $http({
          method: 'PUT',
          headers: headers,
          url: url + '/' + config.object.data.id,
          data: config.object.form.toJson()
        }).then(resolveHttp, rejectHttp);
      }

      function add(config) {
        return $http({
          method: 'POST',
          headers: headers,
          url: url + '/',
          data: config.object.form.toJson()
        }).then(resolveHttp, rejectHttp);
      }

      function resolveHttp(response) {
        return $q.resolve(response.data);
      }

      function rejectHttp(response) {
        var deferred = $q.defer();

        if (response.status === 0) {
          $http({
            method: 'GET',
            url: 'https://status.cloud.google.com/incidents.schema.json'
          }).then(rejectServerOffline, rejectNoConnection);
        } else {
          deferred.reject({status: response.status, statusText: response.statusText});
        }

        return deferred.promise;

        function rejectServerOffline() {
          deferred.reject({status: response.status, statusText: 'Server is offline'});
        }

        function rejectNoConnection() {
          deferred.reject({status: response.status, statusText: 'No internet connection'});
        }
      }
    }
  }
  AngularJsonAPISynchronizationRestWrapper.$inject = ["AngularJsonAPISynchronizationPrototype", "AngularJsonAPIModelLinkerService", "toKebabCase", "$q", "$http"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPISynchronizationPrototype', AngularJsonAPISynchronizationPrototypeWrapper);

  function AngularJsonAPISynchronizationPrototypeWrapper() {
    AngularJsonAPISynchronizationPrototype.prototype.before = beforeSynchro;
    AngularJsonAPISynchronizationPrototype.prototype.after = afterSynchro;
    AngularJsonAPISynchronizationPrototype.prototype.begin = begin;
    AngularJsonAPISynchronizationPrototype.prototype.finish = finish;
    AngularJsonAPISynchronizationPrototype.prototype.synchronization = synchronization;

    return AngularJsonAPISynchronizationPrototype;

    function AngularJsonAPISynchronizationPrototype() {
      var _this = this;
      var allHooks = [
        'add',
        'init',
        'get',
        'all',
        'clear',
        'remove',
        'unlink',
        'unlinkReflection',
        'link',
        'linkReflection',
        'update',
        'refresh'
      ];

      _this.state = {};

      _this.beginHooks = {};
      _this.beforeHooks = {};
      _this.synchronizationHooks = {};
      _this.afterHooks = {};
      _this.finishHooks = {};

      _this.options = {};

      angular.forEach(allHooks, function(hookName) {
        _this.beginHooks[hookName] = [];
        _this.beforeHooks[hookName] = [];
        _this.synchronizationHooks[hookName] = [];
        _this.afterHooks[hookName] = [];
        _this.finishHooks[hookName] = [];
        _this.state[hookName] = {
          loading: false,
          success: true
        };
      });
    }

    function begin(action, callback) {
      var _this = this;

      _this.beginHooks[action].push(callback);
    }

    function finish(action, callback) {
      var _this = this;

      _this.finishHooks[action].push(callback);
    }

    function beforeSynchro(action, callback) {
      var _this = this;

      _this.beforeHooks[action].push(callback);
    }

    function afterSynchro(action, callback) {
      var _this = this;

      _this.afterHooks[action].push(callback);
    }

    function synchronization(action, callback) {
      var _this = this;

      _this.synchronizationHooks[action].push(callback);
    }

  }
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi-local', ['angular-jsonapi'])
  .factory('AngularJsonAPISynchronizationLocal', AngularJsonAPISynchronizationLocalWrapper);

  function AngularJsonAPISynchronizationLocalWrapper(
    AngularJsonAPISynchronizationPrototype,
    $window,
    $q
  ) {

    AngularJsonAPISynchronizationLocal.prototype = Object.create(AngularJsonAPISynchronizationPrototype.prototype);
    AngularJsonAPISynchronizationLocal.prototype.constructor = AngularJsonAPISynchronizationLocal;

    return AngularJsonAPISynchronizationLocal;

    function AngularJsonAPISynchronizationLocal(prefix) {
      var _this = this;

      prefix = prefix || 'AngularJsonAPI';

      _this.__updateStorage = updateStorage;

      AngularJsonAPISynchronizationPrototype.call(_this);

      _this.synchronization('init', init);

      _this.begin('clear', clear);
      _this.begin('remove', updateStorage);
      _this.begin('refresh', updateStorage);
      _this.begin('unlink', updateStorage);
      _this.begin('unlinkReflection', updateStorage);
      _this.begin('link', updateStorage);
      _this.begin('linkReflection', updateStorage);
      _this.begin('update', updateStorage);
      _this.begin('add', updateStorage);
      _this.finish('get', updateStorage);
      _this.finish('all', updateStorage);

      _this.finish('init', updateStorage);
      _this.finish('clear', updateStorage);
      _this.finish('remove', updateStorage);
      _this.finish('refresh', updateStorage);
      _this.finish('unlink', updateStorage);
      _this.finish('unlinkReflection', updateStorage);
      _this.finish('link', updateStorage);
      _this.finish('linkReflection', updateStorage);
      _this.finish('update', updateStorage);
      _this.finish('add', updateStorage);
      _this.finish('get', updateStorage);
      _this.finish('all', updateStorage);

      function init() {
        var type = _this.synchronizer.factory.schema.type;
        return $q.when($window.localStorage.getItem(prefix + '.' + type));
      }

      function clear() {
        var type = _this.synchronizer.factory.schema.type;
        $window.localStorage.removeItem(prefix + '.' + type);
      }

      function updateStorage() {
        var type = _this.synchronizer.factory.schema.type;
        var cache = _this.synchronizer.factory.cache;
        $window.localStorage.setItem(prefix + '.' + type, cache.toJson());
      }
    }
  }
  AngularJsonAPISynchronizationLocalWrapper.$inject = ["AngularJsonAPISynchronizationPrototype", "$window", "$q"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPISchema', AngularJsonAPISchemaWrapper);

  function AngularJsonAPISchemaWrapper($log, pluralize, AngularJsonAPISchemaLink) {

    return AngularJsonAPISchema;

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

      angular.forEach(schema.relationships, function(linkSchema, linkName) {
        var linkSchemaObj = new AngularJsonAPISchemaLink(linkSchema, linkName, schema.type);
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
        _this.params.get.include = include.get.join(',');
      }

      if (include.all.length > 0) {
        _this.params.all.include = include.all.join(',');
      }
    }

  }
  AngularJsonAPISchemaWrapper.$inject = ["$log", "pluralize", "AngularJsonAPISchemaLink"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPISchemaLink', AngularJsonAPILinkSchrapperLink);

  function AngularJsonAPILinkSchrapperLink($log, pluralize) {

    return AngularJsonAPISchemaLink;

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
  AngularJsonAPILinkSchrapperLink.$inject = ["$log", "pluralize"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModel', AngularJsonAPIModel);

  function AngularJsonAPIModel(AngularJsonAPIAbstractModel, AngularJsonAPISchema, $log) {

    return {
      model: modelFactory
    };

    function modelFactory(schemaObj, parentFactory) {
      var Model = function(data, updatedAt, saved) {
        var _this = this;

        if (data.type !== _this.schema.type) {
          $log.error('Data type other then declared in schema: ', data.type, ' instead of ', _this.schema.type);
        }

        AngularJsonAPIAbstractModel.call(_this, data, updatedAt, saved);

        _this.form.parent = _this;
      };

      Model.prototype = Object.create(AngularJsonAPIAbstractModel.prototype);
      Model.prototype.constructor = Model;

      Model.prototype.schema = schemaObj;
      Model.prototype.parentFactory = parentFactory;
      Model.prototype.synchronize = parentFactory.synchronizer.synchronize.bind(parentFactory.synchronizer);

      angular.forEach(schemaObj.functions, function(metaFunction, metaFunctionName) {
        Model.prototype[metaFunctionName] = function() {
          return metaFunction.apply(this, arguments);
        };
      });

      return Model;
    }

  }
  AngularJsonAPIModel.$inject = ["AngularJsonAPIAbstractModel", "AngularJsonAPISchema", "$log"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIFactory', AngularJsonAPIFactoryWrapper);

  function AngularJsonAPIFactoryWrapper(
    AngularJsonAPIModel,
    AngularJsonAPISchema,
    AngularJsonAPICache,
    AngularJsonAPICollection,
    uuid4,
    $rootScope,
    $q
  ) {
    AngularJsonAPIFactory.prototype.get = get;
    AngularJsonAPIFactory.prototype.all = all;
    AngularJsonAPIFactory.prototype.remove = remove;
    AngularJsonAPIFactory.prototype.initialize = initialize;

    AngularJsonAPIFactory.prototype.clear = clear;

    return AngularJsonAPIFactory;

    /**
     * AngularJsonAPIFactory constructor
     * @param {json} schema       Schema object
     * @param {AngularJsonAPISynchronizer} synchronizer Synchronizer for the factory
     */
    function AngularJsonAPIFactory(schema, synchronizer) {
      var _this = this;
      var config = {
        action: 'init'
      };

      _this.schema = new AngularJsonAPISchema(schema);
      _this.cache = new AngularJsonAPICache(_this);

      _this.synchronizer = synchronizer;
      _this.synchronizer.factory = _this;

      _this.Model = AngularJsonAPIModel.model(
        _this.schema,
        _this
      );

      _this.initialized = false;
      _this.type = _this.schema.type;

      synchronizer.factory = _this;

      _this.synchronizer.synchronize(config).then(resolve, reject, notify);

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':factory:init', 'resolved', response);
        _this.cache.fromJson(response.data);
        _this.initialized = true;

        response.finish();
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':factory:init', 'rejected', response);
        response.finish();
        _this.initialized = true;
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':factory:init', 'notify', response);
      }
    }

    /**
     * Get request
     * @param  {uuid} id
     * @return {AngularJsonAPIModel} Model associated with id, synchronized
     */
    function get(id) {
      var _this = this;

      if (!uuid4.validate(id)) {
        return $q.reject({errors: [{status: 0, statusText: 'Invalid id not uuid4'}]});
      }

      return _this.cache.get(id).refresh();
    }

    /**
     * All request
     * @param  {object} params Object associated with params (for filters/pagination etc.)
     * @return {AngularJsonAPICollection} Collection of AngularJsonAPIModel, synchronized
     */
    function all(params) {
      var _this = this;
      params = params || {};

      var collection = new AngularJsonAPICollection(
        _this,
        angular.extend(params, _this.schema.params.all)
      );

      collection.fetch();

      return collection;
    }

    /**
     * Remove request
     * @param  {uuid} id
     * @return {promise} Promise associated with the synchronization, in case of
     * fail object is reverted to previous state
     */
    function remove(id) {
      var _this = this;
      var object = _this.cache.remove(id);

      return object.remove();
    }

    /**
     * Initialize new AngularJsonAPIModel
     * @return {AngularJsonAPIModel} New model
     */
    function initialize() {
      var _this = this;

      var data = {
        type: _this.type,
        id: uuid4.generate(),
        attributes: {},
        relationships: {}
      };

      var model = new _this.Model(data, false, false);

      return model;
    }

    /**
     * Clears localy saved data
     * @return {promise} Promise associated with the synchronization resolves to nothing
     */
    function clear() {
      var _this = this;
      var deferred = $q.defer();
      var config = {
        action: 'clear'
      };

      _this.cache.clear();

      _this.synchronizer.synchronize(config).then(resolve, reject, notify);

      return deferred;

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':factory:clear', 'resolved', response);
        response.finish();

        deferred.resolve(response);
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':factory:clear', 'resolved', response);
        response.finish();

        deferred.reject(response);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':factory:clear', 'notify', response);

        deferred.notify(response);
      }
    }
  }
  AngularJsonAPIFactoryWrapper.$inject = ["AngularJsonAPIModel", "AngularJsonAPISchema", "AngularJsonAPICache", "AngularJsonAPICollection", "uuid4", "$rootScope", "$q"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPICollection', AngularJsonAPICollectionWrapper);

  function AngularJsonAPICollectionWrapper(
    $rootScope,
    $injector,
    $q
  ) {

    AngularJsonAPICollection.prototype.fetch = fetch;
    AngularJsonAPICollection.prototype.refresh = fetch;
    AngularJsonAPICollection.prototype.get = get;

    return AngularJsonAPICollection;

    /**
     * Constructor
     * @param {AngularJsonAPIFactory} factory Factory associated with the collection
     * @param {object} params  Params associated with this factory (such as filters)
     */
    function AngularJsonAPICollection(factory, params) {
      var _this = this;

      _this.factory = factory;
      _this.type = factory.schema.type;
      _this.params = params;

      _this.errors = {
        synchronization: {
          name: 'Synchronization',
          description: 'Errors during synchronization',
          errors: []
        }
      };

      _this.error = false;

      _this.data = _this.factory.cache.index(_this.params);
      _this.synchronized = false;

      $rootScope.$on('angularJsonAPI:' + _this.type + ':object:remove', remove);

      function remove(event, status, object) {
        var index;

        if (status === 'resolved') {

          index = _this.data.indexOf(object);
          if (index > -1) {
            _this.data.splice(index, 1);
            _this.factory.cache.setIndexIds(_this.data);
          }
        }
      }
    }

    /**
     * Shortcut to this.factory.get
     * @param  {uuid4} id Id of object]
     * @return {AngularJsonAPIModel}          Model with id
     */
    function get(id) {
      var _this = this;

      return _this.factory.get(id);
    }

    /**
     * Synchronizes collection with the server
     * @return {promise} Promise associated with synchronization that resolves to this
     */
    function fetch() {
      var _this = this;
      var deferred = $q.defer();
      var $jsonapi = $injector.get('$jsonapi');
      var config = {
        action: 'all',
        params: _this.params
      };

      _this.factory.synchronizer.synchronize(config).then(resolve, reject, notify);

      return deferred.promise;

      function resolve(results) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':collection:fetch', 'resolved', _this, results);

        _this.errors.synchronization.errors = [];
        _this.data = $jsonapi.proccesResults(results.data);
        _this.error = false;

        _this.updatedAt = Date.now();
        _this.synchronized = true;

        _this.factory.cache.setIndexIds(_this.data);

        results.finish();

        deferred.resolve(_this);
      }

      function reject(results) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':collection:fetch', 'rejected', _this, results);

        _this.errors.synchronization.errors = results.errors;
        _this.error = true;

        results.finish();

        deferred.reject(results);
      }

      function notify(results) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':collection:fetch', 'notify', _this, results);

        deferred.notify(results);
      }
    }
  }
  AngularJsonAPICollectionWrapper.$inject = ["$rootScope", "$injector", "$q"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .provider('$jsonapi', jsonapiProvider);

  function jsonapiProvider() {
    var memory = {};
    var names = [];
    this.$get = jsonapiFactory;

    function jsonapiFactory($log, AngularJsonAPIFactory) {
      return {
        form: form,
        get: get,
        remove: remove,
        all: all,
        addFactory: addFactory,
        getFactory: getFactory,
        clearAll: clearAll,
        proccesResults: proccesResults,

        allFactories: allFactories,
        factoriesNames: factoriesNames
      };

      function allFactories() {
        return memory;
      }

      function factoriesNames() {
        return names;
      }

      function addFactory(schema, synchronization) {
        var factory = new AngularJsonAPIFactory(schema, synchronization);

        memory[schema.type] = factory;
        names.push(schema.type);
      }

      function getFactory(type) {
        return memory[type];
      }

      function form(type) {
        if (memory[type] === undefined) {
          $log.error('Can\t add not existing object type: ' + type + '. Use initialize(Model, datas).');
        }

        return memory[type].saved.form;
      }

      function get(type, id) {
        if (memory[type] === undefined) {
          $log.error('Can\t get not existing object type: ' + type + '. Use initialize(Model, datas).');
        }

        return memory[type].get(id);
      }

      function remove(type, id) {
        if (memory[type] === undefined) {
          $log.error('Can\t remove not existing object type: ' + type + '. Use initialize(Model, datas).');
        }

        return memory[type].remove(id);
      }

      function all(type) {
        if (memory[type] === undefined) {
          $log.error('Can\t get all of not existing object type: ' + type + '. Use initialize(Model, datas).');
        }

        return memory[type].all();
      }

      function clearAll() {
        angular.forEach(memory, function(factory) {
          factory.clear();
        });
      }

      function proccesResults(results) {
        if (results === undefined) {
          $log.error('Can\'t proccess results:', results);
        }

        angular.forEach(results.included, function(data) {
          getFactory(data.type).cache.addOrUpdate(data, true);
        });

        if (angular.isArray(results.data)) {
          var objects = [];
          angular.forEach(results.data, function(data) {
            objects.push(getFactory(data.type).cache.addOrUpdate(data, true));
          });

          return objects;
        } else {
          return getFactory(results.data.type).cache.addOrUpdate(results.data, true);
        }
      }
    }
    jsonapiFactory.$inject = ["$log", "AngularJsonAPIFactory"];
  }

})();


(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .config(["$logProvider", function($logProvider) {
    $logProvider.debugEnabled(false);
  }]);
})();

//# sourceMappingURL=angular-jsonapi.js.map