(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIResource', AngularJsonAPIResourceWrapper);

  function AngularJsonAPIResourceWrapper(
    AngularJsonAPIModel,
    AngularJsonAPISchema,
    AngularJsonAPIResourceCache,
    AngularJsonAPICollection,
    $rootScope,
    $log,
    $q
  ) {
    AngularJsonAPIResource.prototype.get = get;
    AngularJsonAPIResource.prototype.all = all;
    AngularJsonAPIResource.prototype.remove = remove;
    AngularJsonAPIResource.prototype.initialize = initialize;

    AngularJsonAPIResource.prototype.clearCache = clearCache;

    return {
      create: AngularJsonAPIResourceFactory
    };

    function AngularJsonAPIResourceFactory(schema, synchronizer) {
      return new AngularJsonAPIResource(schema, synchronizer);
    }

    /**
     * AngularJsonAPIResource constructor
     * @param {json} schema       Schema object
     * @param {AngularJsonAPISynchronizer} synchronizer Synchronizer for the resource
     */
    function AngularJsonAPIResource(schema, synchronizer) {
      var _this = this;
      var config = {
        action: 'init'
      };

      _this.schema = AngularJsonAPISchema.create(schema);
      _this.cache = AngularJsonAPIResourceCache.create(_this);

      _this.synchronizer = synchronizer;
      _this.synchronizer.resource = _this;

      _this.modelFactory = AngularJsonAPIModel.modelFactory(
        _this.schema,
        _this
      );

      _this.initialized = false;
      _this.type = _this.schema.type;

      synchronizer.resource = _this;

      _this.synchronizer.synchronize(config).then(resolve, reject, notify);

      function resolve(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':resource:init', 'resolved', response);
        _this.cache.fromJson(response.data);
        _this.initialized = true;

        response.finish();
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':resource:init', 'rejected', response);
        response.finish();
        _this.initialized = true;
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':resource:init', 'notify', response);
      }
    }

    /**
     * Get request
     * @param  {uuid} id
     * @return {AngularJsonAPIModel} Model associated with id, synchronized
     */
    function get(id, params) {
      var _this = this;

      if (!_this.schema.id.validate(id)) {
        return $q.reject({errors: [{status: 0, statusText: 'Invalid id'}]});
      }

      var object = _this.cache.get(id);

      object.promise = object.refresh(params);

      return object;
    }

    /**
     * All request
     * @param  {object} params Object associated with params (for filters/pagination etc.)
     * @return {AngularJsonAPICollection} Collection of AngularJsonAPIModel, synchronized
     */
    function all(params) {
      var _this = this;
      params = angular.extend({}, _this.schema.params.all, params);

      var collection = AngularJsonAPICollection.create(
        _this,
        params
      );

      collection.promise = collection.fetch();

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

      var data = {
        type: _this.type,
        id: _this.schema.id.generate(),
        attributes: {},
        relationships: relationships
      };

      var config = {
        new: true,
        synchronized: false,
        stable: false,
        pristine: false,
        initialization: false
      };

      var object = _this.modelFactory(data, config);

      $rootScope.$emit('angularJsonAPI:' + _this.type + ':resource:initialize', 'resolved', object);

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
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':resource:clearCache', 'resolved', response);
        response.finish();

        deferred.resolve(response);
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':resource:clearCache', 'resolved', response);
        response.finish();

        deferred.reject(response);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':resource:clearCache', 'notify', response);

        deferred.notify(response);
      }
    }
  }
})();
