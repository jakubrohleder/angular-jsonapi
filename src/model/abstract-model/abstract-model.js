(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIAbstractModel', AngularJsonAPIAbstractModelWrapper);

  function AngularJsonAPIAbstractModelWrapper(
    AngularJsonAPIModelForm,
    AngularJsonAPIModelLinkerService,
    uuid4,
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
     * @param {Boolean} isNew   Is object new (for form)
     */
    function AngularJsonAPIAbstractModel(data, isNew) {
      var _this = this;

      data.relationships = data.relationships || {};

      _this.isNew = isNew || false;
      _this.form = new AngularJsonAPIModelForm(_this);
      _this.removed = false;
      _this.loadingCount = 0;

      _this.data = {
        relationships: {},
        attributes: {}
      };
      _this.relationships = {};

      _this.errors = {
        validation: {}
      };

      _this.promises = {};

      __setData(_this, data, true);
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

      if (_this.isNew === true) {
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
        return deferred.promise;
      } else {
        _this.synchronize(config).then(resolved, rejected);
      }

      return deferred.promise;

      function resolved(data, finish) {
        __setData(_this, _this.form.data);
        finish();

        return _this;
      }

      function rejected(errors, finish) {
        finish();

        return errors;
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
      var deferred = $q.defer();
      var _this = this;
      var config = {
        action: 'refresh',
        object: _this,
        params: _this.schema.params.get
      };

      if (_this.isNew === true) {
        $log.error('Can\'t refresh new object');
        deferred.reject('Can\'t refresh new object');
      } else {
        _this.synchronize(config).then(resolved, rejected);
      }

      function resolved(data, finish) {
        _this.update(data);
        finish();

        return _this;
      }

      function rejected(errors, finish) {
        finish();

        return errors;
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

      return _this.parentFactory.remove(_this.data.id);
    }

    /**
     * Unlink all relationships of the object **without synchronization**
     * @return {boolean} Result
     */
    function unlinkAll() {
      var _this = this;

      angular.forEach(_this.relationships, function(link, key) {
        AngularJsonAPIModelLinkerService.unlink(_this, key, undefined, _this.schema.relationships[key]);
      });
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
      var promise;

      if (!AngularJsonAPIModelLinkerService.link(_this, key, target, schema) ||
          !AngularJsonAPIModelLinkerService.link(target, reflectionKey, _this, reflectionSchema)) {

        deferred.reject();
        return deferred.promise;
      }

      promise = $q.all(_this.synchronize({
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
      }));

      promise.then(resolved, rejected);

      function resolved(data, finish) {
        deferred.resolve(_this);

        finish();
        return data;
      }

      function rejected(errors, finish) {
        AngularJsonAPIModelLinkerService.unlink(_this, key, target, schema);
        AngularJsonAPIModelLinkerService.unlink(target, reflectionKey, _this, reflectionSchema);

        deferred.reject(errors);
        finish();
        return errors;
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

        deferred.reject();
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

      promise.then(resolved, rejected);

      function resolved(data, finish) {
        deferred.resolve(_this);

        finish();
        return data;
      }

      function rejected(errors, finish) {
        AngularJsonAPIModelLinkerService.unlink(_this, key, target, schema);
        AngularJsonAPIModelLinkerService.unlink(target, reflectionKey, _this, reflectionSchema);

        deferred.reject(errors);
        finish();
        return errors;
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

      return __setData(_this, validatedData);
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

      object.id = validatedData.id;
      object.type = validatedData.type;

      if (object.parentFactory.schema.type !== validatedData.type) {
        $log.error('Different type then factory');
        return false;
      }

      if (!uuid4.validate(object.id)) {
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
        var factory = $jsonapi.getModel(data.type);
        var target = factory.get(data.id);
        var reflectionKey = schema.reflection;
        var reflectionSchema = target.schema.relationships[reflectionKey];

        AngularJsonAPIModelLinkerService.link(object, key, target, schema);

        if (initialize !== true && reflectionKey !== false) {
          AngularJsonAPIModelLinkerService.link(object, reflectionKey, target, reflectionSchema);
        }
      }
    }
  }
})();
