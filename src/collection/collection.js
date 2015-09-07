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
        $rootScope.$emit('angularJsonAPI:collection:fetch', 'resolved', results);

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
        $rootScope.$emit('angularJsonAPI:collection:fetch', 'rejected', results);

        _this.errors.synchronization.errors = results.errors;
        _this.error = true;

        results.finish();

        deferred.reject(results);
      }

      function notify(results) {
        $rootScope.$emit('angularJsonAPI:collection:fetch', 'notify', results);

        deferred.notify(results);
      }
    }
  }
})();
