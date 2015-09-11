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
    $log,
    $q
  ) {
    AngularJsonAPIFactory.prototype.get = get;
    AngularJsonAPIFactory.prototype.all = all;
    AngularJsonAPIFactory.prototype.remove = remove;
    AngularJsonAPIFactory.prototype.initialize = initialize;

    AngularJsonAPIFactory.prototype.clearCache = clearCache;

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

      var object = _this.cache.get(id);

      object.refresh();

      return object;
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
    function initialize(key, target) {
      var _this = this;
      var relationships = {};

      angular.forEach(_this.schema.relationships, function(relationshipSchema, relationshipName) {
        if (relationshipSchema.type === 'hasOne') {
          relationships[relationshipName] = {
            data: null
          };
        } else if (relationshipSchema.type === 'hasMany') {
          relationships[relationshipName] = {
            data: []
          };
        }
      });

      if (key !== undefined && target !== undefined) {
        var schema = _this.schema[key];

        if (schema.type === 'hasOne') {
          relationships[key] = {
            data: target.data.id
          };
        } else if (schema.type === 'hasMany') {
          $log.warn('Initialize with relationship disallowed for hasMany relationships');
        }
      }

      var data = {
        type: _this.type,
        id: uuid4.generate(),
        attributes: {},
        relationships: relationships
      };

      var config = {
        saved: false,
        synchronized: false,
        initialization: false
      };

      var object = _this.cache.addOrUpdate(data, config);

      $rootScope.$emit('angularJsonAPI:' + _this.type + ':factory:initialize', 'resolved', object);

      return object;
    }

    /**
     * Clears localy saved data
     * @return {promise} Promise associated with the synchronization resolves to nothing
     */
    function clearCache() {
      var _this = this;
      var deferred = $q.defer();
      var config = {
        action: 'clearCache'
      };

      _this.cache.clear();

      _this.synchronizer.synchronize(config).then(resolve, reject, notify);

      return deferred;

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':factory:clearCache', 'resolved', response);
        response.finish();

        deferred.resolve(response);
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':factory:clearCache', 'resolved', response);
        response.finish();

        deferred.reject(response);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':factory:clearCache', 'notify', response);

        deferred.notify(response);
      }
    }
  }
})();
