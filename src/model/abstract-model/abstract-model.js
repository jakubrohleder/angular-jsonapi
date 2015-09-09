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
    function AngularJsonAPIAbstractModel(data, saved, synchronized) {
      var _this = this;

      data.relationships = data.relationships || {};

      /**
       * Is not a new record
       * @type {Boolean}
       */
      _this.saved = saved === undefined ? true : saved;

      /**
       * Is present on the server
       * @type {Boolean}
       */
      _this.stable = synchronized === undefined ? true : synchronized;

      /**
       * Has been synchronized with the server
       * @type {Boolean}
       */
      _this.synchronized = synchronized === undefined ? true : synchronized;

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
        action: _this.saved === false ? 'add' : 'update',
        object: _this
      };

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

        _this.synchronized = true;
        _this.saved = true;
        _this.stable = true;

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
        deferred.reject({errors: [{status: 0, statusText: 'Can\'t refresh new object'}]});
      } else {
        _this.synchronize(config).then(resolve, reject, notify);
      }

      return deferred.promise;

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

      return deferred.promise;

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
      var config = {
        action: 'link',
        object: _this,
        schema: schema,
        target: target,
        key: key
      };

      if (target === undefined) {
        deferred.reject({errors: [{status: 0, statusText: 'Can\'t link undefined'}]});
      } else if (_this.saved === false) {
        deferred.reject({errors: [{status: 0, statusText: 'Can\'t link new object'}]});
      } else {
        _this.synchronize(config).then(resolve, reject, notify);
      }

      return deferred.promise;

      function resolve(response) {
        var reflectionSchema = target.schema.relationships[reflectionKey];

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
      var config = {
        action: 'unlink',
        object: _this,
        target: target,
        schema: schema,
        key: key
      };

      if (target === undefined) {
        deferred.reject({errors: [{status: 0, statusText: 'Can\'t unlink undefined'}]});
      } else if (_this.saved === false) {
        deferred.reject({errors: [{status: 0, statusText: 'Can\'t unlink new object'}]});
      } else {
        _this.synchronize(config).then(resolve, reject, notify);
      }

      return deferred.promise;

      function resolve(response) {
        var reflectionSchema = target.schema.relationships[reflectionKey];
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
        _this.stable = true;
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
})();
