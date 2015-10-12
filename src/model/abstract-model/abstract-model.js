(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIAbstractModel', AngularJsonAPIAbstractModelWrapper);

  function AngularJsonAPIAbstractModelWrapper(
    AngularJsonAPIModelSourceError,
    AngularJsonAPIModelValidationError,
    AngularJsonAPIModelErrorsManager,
    AngularJsonAPIModelLinkerService,
    AngularJsonAPIModelForm,
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

    AngularJsonAPIAbstractModel.prototype.hasErrors = hasErrors;

    return AngularJsonAPIAbstractModel;

    /**
     * Constructor
     * @param {json}  data      Validated data used to create an object
     * @param {object} config   Is object new (for form)
     */
    function AngularJsonAPIAbstractModel(data, config, updatedAt) {
      var _this = this;

      data.relationships = data.relationships || {};

      /**
       * Is not a new record
       * @type {Boolean}
       */
      _this.new = config.new === undefined ? false : config.new;

      /**
       * Is present on the server
       * @type {Boolean}
       */
      _this.stable = config.stable === undefined ? true : config.stable;

      /**
       * Has been synchronized with the server
       * @type {Boolean}
       */
      _this.synchronized = config.synchronized === undefined ? true : config.synchronized;

      /**
       * Has just been created by request and may not exist on the server
       * @type {Boolean}
       */
      _this.pristine = config.pristine === undefined ? true : config.pristine;

      _this.removed = false;
      _this.loading = false;
      _this.saving = false;
      _this.updatedAt = _this.synchronized === true ? Date.now() : updatedAt;

      _this.loadingCount = 0;
      _this.savingCount = 0;

      _this.data = {
        relationships: {},
        attributes: {}
      };
      _this.relationships = {};

      angular.forEach(_this.schema.relationships, function(schema, key) {
        _this.relationships[key] = undefined;
      });

      _this.errors = {
        validation: AngularJsonAPIModelErrorsManager.create(
          'Validation',
          'Errors of attributes validation',
          AngularJsonAPIModelValidationError
        ),
        synchronization: AngularJsonAPIModelErrorsManager.create(
          'Source',
          'Errors of synchronizations',
          AngularJsonAPIModelSourceError
        )
      };

      _this.promise = $q.resolve(_this);

      __setData(_this, data);

      _this.form = AngularJsonAPIModelForm.create(_this);
    }

    /**
     * Saves model's form
     * @return {promise} Promise associated with synchronization that resolves to this
     */
    function save() {
      var _this = this;
      var deferred = $q.defer();
      var config = {
        action: _this.new === true ? 'add' : 'update',
        object: _this
      };

      _this.form.validate().then(
        synchronize,
        deferred.reject
      ).finally(__decrementSavingCounter.bind(_this, undefined));

      __incrementSavingCounter(_this);

      return deferred.promise;

      function synchronize() {
        _this.synchronize(config).then(resolve, reject, notify);
      }

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:' + config.action, 'resolved', _this, response);
        _this.update(response.data.data);

        if (_this.new === true) {
          _this.resource.cache.indexIds = _this.resource.cache.indexIds || [];
          _this.resource.cache.indexIds.push(_this.data.id);
        }

        _this.synchronized = true;
        _this.new = false;
        _this.pristine = false;
        _this.stable = true;

        response.finish();
        _this.errors.synchronization.concat(response.errors);
        deferred.resolve(response.data.meta);
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:save', 'rejected', _this, response);

        response.finish();
        _this.errors.synchronization.concat(response.errors);
        deferred.reject(_this);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:save', 'notify', _this, response);

        deferred.notify(response);
      }
    }

    /**
     * Reset object form
     * @return {undefined}
     */
    function reset() {
      var _this = this;

      if (_this.form !== undefined) {
        _this.form.reset();
      }
    }

    /**
     * Synchronize object with remote
     * @return {promise} Promise associated with synchronization that resolves to this
     */
    function refresh(params) {
      var $jsonapi = $injector.get('$jsonapi');
      var deferred = $q.defer();
      var _this = this;
      params = params === undefined ? _this.schema.params.get : params;

      var config = {
        action: 'refresh',
        object: _this,
        params: params
      };

      if (_this.new === true) {
        var error = AngularJsonAPIModelSourceError.create('Can\'t refresh new object', null, 0, 'refresh');
        _this.errors.synchronization.add('refresh', error);
        deferred.reject(error);
      } else {
        __incrementLoadingCounter(_this);

        _this.synchronize(config)
          .then(resolve, reject, notify)
          .finally(__decrementLoadingCounter.bind(_this, undefined));
      }

      return deferred.promise;

      function resolve(response) {
        var results = $jsonapi.__proccesResults(response.data);
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:refresh', 'resolved', _this, response);
        $q.allSettled(results.included.map(synchronizeIncluded)).then(resolveIncluded, deferred.reject);

        _this.synchronized = true;
        _this.stable = true;
        _this.pristine = false;

        response.finish();
        _this.errors.synchronization.concat(response.errors);

        function synchronizeIncluded(object) {
          __incrementLoadingCounter(object);

          return object.synchronize({
            action: 'include',
            object: object
          }).finally(__decrementLoadingCounter.bind(object, undefined));
        }

        function resolveIncluded(includedResponse) {
          angular.forEach(includedResponse, function(operation, key) {
            if (operation.success === true) {
              $rootScope.$emit('angularJsonAPI:' + results.included[key].data.type + ':object:include', 'resolved', results.included[key], operation);
              operation.value.finish();
            }
          });

          deferred.resolve(response.data.meta);
        }
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:refresh', 'rejected', _this, response);

        response.finish();
        _this.errors.synchronization.concat(response.errors);
        deferred.reject(_this);
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
      var data = _this.data;
      var relationships = {};

      angular.forEach(data.relationships, function(value, key) {
        if (value.data !== undefined) {
          relationships[key] = value;
        }
      });

      data.relationships = relationships;

      return {
        data: data,
        updatedAt: _this.updatedAt
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

      _this.resource.cache.remove(_this.data.id);

      if (_this.new === true) {
        deferred.resolve();
      } else {
        __incrementSavingCounter(_this);

        _this.synchronize(config)
          .then(resolve, reject, notify)
          .finally(__decrementSavingCounter.bind(_this, undefined));
      }

      return deferred.promise;

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:remove', 'resolved', _this, response);
        _this.removed = true;
        _this.unlinkAll();
        _this.resource.cache.clearRemoved(_this.data.id);

        response.finish();
        _this.errors.synchronization.concat(response.errors);

        deferred.resolve();
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:remove', 'rejected', _this, response);
        _this.resource.cache.revertRemove(_this.data.id);

        response.finish();
        _this.errors.synchronization.concat(response.errors);
        deferred.reject(_this);
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

      __incrementLoadingCounter(_this);

      if (key === undefined) {
        angular.forEach(_this.relationships, removeLink);
      } else {
        removeLink(_this.relationships[key], key);
      }

      __decrementLoadingCounter(_this);

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
        var config = {
          action: 'unlinkReflection',
          object: target,
          target: _this,
          key: reflectionKey
        };

        __incrementLoadingCounter(target);
        AngularJsonAPIModelLinkerService.unlink(target, reflectionKey, _this, reflectionSchema);

        target.synchronize(config)
          .then(resolve, reject, notify)
          .finally(__decrementLoadingCounter.bind(target, undefined));

        function resolve(response) {
          $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlinkReflection', 'resolve', _this, response);

          response.finish();
          _this.errors.synchronization.concat(response.errors);
          deferred.resolve();
        }

        function reject(response) {
          $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlinkReflection', 'rejected', _this, response);

          response.finish();
          _this.errors.synchronization.concat(response.errors);
          deferred.reject(_this);
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
      var error;
      var config = {
        action: 'link',
        object: _this,
        target: target,
        key: key
      };

      if (target === undefined) {
        error = AngularJsonAPIModelSourceError.create('Can\'t link undefined', null, 0, 'link');
        _this.errors.synchronization.add('link', error);
        deferred.reject(error);
      } else if (_this.new === true) {
        error = AngularJsonAPIModelSourceError.create('Can\'t link new object', null, 0, 'link');
        _this.errors.synchronization.add('link', error);
        deferred.reject(error);
      } else {
        __incrementSavingCounter(_this);

        _this.synchronize(config)
          .then(resolve, reject, notify)
          .finally(__decrementSavingCounter.bind(_this, undefined));
      }

      return deferred.promise;

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:link', 'resolved', _this, response);

        var targets = AngularJsonAPIModelLinkerService.link(_this, key, target);

        _this.stable = true;
        _this.pristine = false;
        response.finish();
        _this.errors.synchronization.concat(response.errors);

        $q.allSettled(targets.map(synchronize))
          .then(resolveReflection, deferred.reject);

        function synchronize(result) {
          __incrementLoadingCounter(target);

          return target.synchronize({
            action: 'linkReflection',
            object: result.object,
            target: result.target,
            key: result.key
          }).finally(__decrementLoadingCounter.bind(target, undefined));
        }

        function resolveReflection(response) {
          angular.forEach(response, function(operation, key) {
            if (operation.success === true) {
              $rootScope.$emit('angularJsonAPI:' + targets[key].object.data.type + ':object:linkReflection', 'resolved', targets[key], operation);
              operation.value.finish();
            }
          });

          deferred.resolve(response.data.meta);
        }
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:link', 'rejected', _this, response);

        deferred.reject(response.errors);
        response.finish();
        _this.errors.synchronization.concat(response.errors);
        deferred.reject(_this);
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
      var error;
      var config = {
        action: 'unlink',
        object: _this,
        target: target,
        key: key
      };

      if (target === undefined) {
        error = AngularJsonAPIModelSourceError.create('Can\'t unlink undefined', null, 0, 'unlink');
        _this.errors.synchronization.add('unlink', error);
        deferred.reject(_this);
      } else if (_this.new === true) {
        error = AngularJsonAPIModelSourceError.create('Can\'t unlink new object', null, 0, 'unlink');
        _this.errors.synchronization.add('unlink', error);
        deferred.reject(_this);
      } else {
        __incrementSavingCounter(_this);

        _this.synchronize(config)
          .then(resolve, reject, notify)
          .finally(__decrementSavingCounter.bind(_this, undefined));
      }

      return deferred.promise;

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlink', 'resolved', _this, response);

        var targets = AngularJsonAPIModelLinkerService.link(_this, key, target);

        _this.stable = true;
        _this.pristine = false;
        response.finish();
        _this.errors.synchronization.concat(response.errors);

        $q.allSettled(targets.map(synchronize))
          .then(resolveReflection, deferred.reject);

        function synchronize(result) {
          __incrementLoadingCounter(target);

          return target.synchronize({
            action: 'unlinkReflection',
            object: result.object,
            target: result.target,
            key: result.key
          }).finally(__decrementLoadingCounter.bind(target, undefined));
        }

        function resolveReflection(response) {
          angular.forEach(response, function(operation) {
            if (operation.success === true) {
              $rootScope.$emit('angularJsonAPI:' + targets[key].data.type + ':object:unlinkReflection', 'resolved', targets[key], operation);
              response.value.finish();
            }
          });

          deferred.resolve();
        }
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.data.type + ':object:unlink', 'rejected', _this, response);

        deferred.reject(response.errors);
        response.finish();
        _this.errors.synchronization.concat(response.errors);
        deferred.reject(_this);
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
    function update(validatedData, auto, initialization) {
      var _this = this;

      __incrementLoadingCounter(_this);

      __setData(_this, validatedData);
      _this.reset(auto);
      _this.synchronized = initialization === true ? false : true;
      _this.stable = initialization === true ? false : true;
      _this.updatedAt = Date.now();

      __decrementLoadingCounter(_this);
    }

    /**
     * Check if the object has errors
     * @return {Boolean}
     */
    function hasErrors() {
      var _this = this;
      var answer = false;

      angular.forEach(_this.errors, function(error) {
        answer = error.hasErrors() || answer;
      });

      return answer;
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

      if (object.resource.schema.type !== validatedData.type) {
        $log.error('Different type then resource', object.resource.schema.type, validatedData);
        return false;
      }

      if (!object.schema.id.validate(object.data.id)) {
        $log.error('Invalid id');
        return false;
      }

      object.data.links = validatedData.links;
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
          if (object.data.relationships[key] === undefined) {
            object.data.relationships[key] = {data: undefined};
          }

          return;
        }

        object.data.relationships[key] = object.data.relationships[key] || {};
        object.data.relationships[key].links = relationshipData.links;

        if (schema.type === 'hasOne') {
          linkOne(object, key, relationshipData.data);
        } else if (schema.type === 'hasMany') {
          if (angular.isArray(relationshipData.data)) {
            if (relationshipData.data.length === 0) {
              object.data.relationships[key].data = [];
              object.unlinkAll(key);
            } else {
              angular.forEach(
                object.relationships[key],
                unlinkOne.bind(undefined, object, key, relationshipData.data)
              );
              angular.forEach(
                relationshipData.data,
                linkOne.bind(undefined, object, key)
              );
            }
          }
        }
      }

      function linkOne(object, key, data) {
        var resource;

        if (data === null) {
          AngularJsonAPIModelLinkerService.link(object, key, null);
          return;
        }

        if (data === undefined) {
          return;
        }

        resource = $jsonapi.getResource(data.type);

        if (resource === undefined) {
          $log.error('Factory not found', data.type, data);
          return;
        }

        var target = resource.cache.get(data.id);

        AngularJsonAPIModelLinkerService.link(object, key, target);
      }

      function unlinkOne(object, key, relationshipData, target) {
        if (relationshipData.indexOf(target.data.id) > -1) {
          return;
        }

        AngularJsonAPIModelLinkerService.unlink(object, key, target);
      }
    }
  }

  /////////////
  // Private //
  /////////////

  function __incrementLoadingCounter(object) {
    object = object === undefined ? this : object;
    object.loadingCount += 1;
    object.loading = true;
  }

  function __decrementLoadingCounter(object) {
    object = object === undefined ? this : object;
    object.loadingCount -= 1;
    object.loading = object.loadingCount > 0;
  }

  function __incrementSavingCounter(object) {
    object = object === undefined ? this : object;
    object.savingCount += 1;
    object.saving = true;
  }

  function __decrementSavingCounter(object) {
    object = object === undefined ? this : object;
    object.savingCount -= 1;
    object.saving = object.savingCount > 0;
  }
})();
