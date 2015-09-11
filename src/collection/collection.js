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

      _this.data = _this.factory.cache.index(_this.params);

      _this.error = false;
      _this.loading = false;
      _this.loadingCount = 0;
      _this.synchronized = false;
      _this.pristine = _this.data === undefined;

      $rootScope.$on('angularJsonAPI:' + _this.type + ':object:remove', remove);
      $rootScope.$on('angularJsonAPI:' + _this.type + ':factory:clearCache', clear);
      $rootScope.$on('angularJsonAPI:' + _this.type + ':factory:add', add);

      function remove(event, status, object) {
        var index;

        if (status === 'resolved' && _this.data !== undefined) {
          index = _this.data.indexOf(object);
          if (index > -1) {
            _this.data.splice(index, 1);
            _this.factory.cache.setIndexIds(_this.data);
          }
        }
      }

      function clear() {
        _this.data = undefined;
        _this.pristine = true;
      }

      function add(event, status, object, response, addToIndex) {
        if (addToIndex === true && status === 'resolved') {
          _this.data = _this.data || [];
          _this.data.push(object);
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

      __incrementLoadingCounter(this);

      angular.forEach(_this.data, __incrementLoadingCounter);

      _this.factory.synchronizer.synchronize(config)
        .then(resolve, reject, notify)
        .finally(__decrementLoadingCounter.bind(_this));

      return deferred.promise;

      function resolve(response) {
        var results = $jsonapi.proccesResults(response.data);
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':collection:fetch', 'resolved', _this, response);
        $q.allSettled(results.included.map(synchronizeIncluded)).then(resolveIncluded, deferred.reject);

        angular.forEach(_this.data, __decrementLoadingCounter);

        _this.data = results.data;
        _this.errors.synchronization.errors = [];
        _this.error = false;

        _this.updatedAt = Date.now();
        _this.synchronized = true;

        _this.factory.cache.setIndexIds(_this.data);
        response.finish();

        function synchronizeIncluded(object) {
          __incrementLoadingCounter.bind(object);

          return object.synchronize({
            action: 'include',
            object: object
          }).finally(__decrementLoadingCounter.bind(object));
        }

        function resolveIncluded(includedResponse) {
          angular.forEach(includedResponse, function(operation, key) {
            if (operation.success === true) {
              $rootScope.$emit('angularJsonAPI:' + results.included[key].data.type + ':object:include', 'resolved', results.included[key], operation);

              operation.value.finish();
            }
          });

          deferred.resolve(response);
        }

        deferred.resolve(_this);
      }

      function reject(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':collection:fetch', 'rejected', _this, response);

        angular.forEach(_this.data, __decrementLoadingCounter);
        _this.errors.synchronization.errors = response.errors;
        _this.error = true;

        response.finish();

        deferred.reject(response);
      }

      function notify(response) {
        $rootScope.$emit('angularJsonAPI:' + _this.type + ':collection:fetch', 'notify', _this, response);

        deferred.notify(response);
      }
    }
  }

  function __incrementLoadingCounter(object) {
    object = object === undefined ? this : object;
    object.loadingCount += 1;
    object.loading = true;
  }

  function __decrementLoadingCounter(object) {
    object = object === undefined ? this : object;
    object.loadingCount -= 1;
    object.loading = object.loadingCount === 0;
  }
})();
