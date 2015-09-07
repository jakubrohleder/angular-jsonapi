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
    function AngularJsonAPIAbstractModel(data, saved, unstable) {
      var _this = this;

      data.relationships = data.relationships || {};

      _this.saved = saved || true;
      _this.synchronized = false;
      _this.unstable = unstable || false;

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

      __setData(_this, data, true);

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
        $rootScope.$emit('angularJsonAPI:object:save', 'resolved', response);
        _this.update(_this.form.data);

        response.finish();

        deferred.resolve(_this);
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:object:save', 'rejected', response);
        response.finish();

        deferred.reject(response.errors);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:object:save', 'notify', response);

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
        $rootScope.$emit('angularJsonAPI:object:refresh', 'resolved', response);
        $jsonapi.proccesResults(response.data);
        response.finish();

        _this.synchronized = true;
        _this.unstable = false;

        deferred.resolve(response);
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:object:refresh', 'rejected', response);
        response.finish();

        deferred.reject(response);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:object:refresh', 'notify', response);

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
        $rootScope.$emit('angularJsonAPI:object:remove', 'resolved', response);
        _this.removed = true;
        _this.unlinkAll();
        _this.parentFactory.cache.clearRemoved(_this.data.id);
        response.finish();

        deferred.resolve(response);
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:object:remove', 'rejected', response);
        _this.parentFactory.cache.revertRemove(_this.data.id);
        response.finish();

        deferred.reject(response);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:object:remove', 'notify', response);

        deferred.notify(response);
      }

      return deferred.promise;
    }

    /**
     * Unlink all reflection relationships of the object **without synchronization**
     * @return {boolean} Result
     */
    function unlinkAll() {
      var _this = this;

      angular.forEach(_this.relationships, function(linksObj, key) {
        var schema = _this.schema.relationships[key];
        var reflectionKey = schema.reflection;

        if (angular.isArray(linksObj)) {
          angular.forEach(linksObj, removeReflectionLink.bind(undefined, reflectionKey));
        } else if (angular.isObject(linksObj)) {
          removeReflectionLink(reflectionKey, linksObj);
        }
      });

      return true;

      function removeReflectionLink(reflectionKey, target) {
        var reflectionSchema = target.schema.relationships[reflectionKey];
        AngularJsonAPIModelLinkerService.unlink(target, reflectionKey, _this, reflectionSchema);
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
      var reflectionSchema = target.schema.relationships[reflectionKey];

      if (!AngularJsonAPIModelLinkerService.link(_this, key, target, schema) ||
          !AngularJsonAPIModelLinkerService.link(target, reflectionKey, _this, reflectionSchema)) {

        deferred.reject({errors: [{status: 0, statusText: 'Error when linking.'}]});
        return deferred.promise;
      }

      $q.all(_this.synchronize({
        action: 'link',
        object: _this,
        target: target,
        key: key
      }),

      _this.synchronize({
        action: 'linkReflection',
        object: _this,
        target: target,
        key: key
      })).then(resolve, reject, notify);

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:object:link', 'resolved', response);
        deferred.resolve(_this);

        _this.unstable = false;

        response.finish();
        deferred.resolve(response);
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:object:link', 'rejected', response);

        AngularJsonAPIModelLinkerService.unlink(_this, key, target, schema);
        AngularJsonAPIModelLinkerService.unlink(target, reflectionKey, _this, reflectionSchema);

        deferred.reject(response.errors);
        response.finish();
        deferred.reject(response);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:object:link', 'notify', response);

        deferred.notify(response);
      }

      return deferred.promise;
    }

    /**
     * Unlinks object from relationship with the key
     * @param  {string} key    Relationship name
     * @param  {AngularJsonAPIModel} target Object to be unlinked
     * @return {promise}        Promise associated with synchronizations
     */
    function unlink(key, target) {
      var deferred = $q.defer();
      var _this = this;
      var schema = _this.schema.relationships[key];
      var reflectionKey = schema.reflection;
      var reflectionSchema = target.schema.relationships[reflectionKey];
      var promise;

      if (!AngularJsonAPIModelLinkerService.unlink(_this, key, target, schema) ||
          !AngularJsonAPIModelLinkerService.unlink(target, reflectionKey, _this, reflectionSchema)) {

        deferred.reject({errors: [{status: 0, statusText: 'Error when unlinking'}]});
        return deferred.promise;
      }

      promise = $q.all(_this.synchronize({
        action: 'unlink',
        object: _this,
        target: target,
        key: key
      }),

      _this.synchronize({
        action: 'unlinkReflection',
        object: _this,
        target: target,
        key: key
      }));

      promise.then(resolve, reject, notify);

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:object:unlink', 'resolved', response);
        deferred.resolve(_this);

        _this.unstable = false;

        response.finish();
        deferred.resolve(response);
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:object:unlink', 'rejected', response);

        AngularJsonAPIModelLinkerService.unlink(_this, key, target, schema);
        AngularJsonAPIModelLinkerService.unlink(target, reflectionKey, _this, reflectionSchema);

        deferred.reject(response.errors);
        response.finish();
        deferred.reject(response);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:object:unlink', 'notify', response);

        deferred.notify(response);
      }

      return deferred.promise;
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
    function __setData(object, validatedData, initialize) {

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
        if (validatedData.relationships[key] === undefined) {
          if (schema.type === 'hasOne') {
            object.data.relationships[key] = {data: undefined};
          } else if (schema.type === 'hasMany') {
            object.data.relationships[key] = {data: []};
          }
        } else {
          object.data.relationships[key] = validatedData.relationships[key];
          if (schema.type === 'hasOne') {
            linkOne(object, key, schema, object.data.relationships[key].data);
          } else if (schema.type === 'hasMany') {
            angular.forEach(
              object.data.relationships[key].data,
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
        var target = factory.cache.get(data.id);
        var reflectionKey = schema.reflection;
        var reflectionSchema = target.schema.relationships[reflectionKey];

        AngularJsonAPIModelLinkerService.link(object, key, target, schema);

        if (initialize !== true && reflectionKey !== false) {
          AngularJsonAPIModelLinkerService.link(target, reflectionKey, object, reflectionSchema);
        }
      }
    }
  }
})();
