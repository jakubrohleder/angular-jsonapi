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
      $rootScope.$on('angularJsonAPI:' + _this.type + ':factory:clearCache', clear);

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

      function clear() {
        _this.data = undefined;
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
})();
