(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPICollection', AngularJsonAPICollectionWrapper);

  function AngularJsonAPICollectionWrapper(
    $rootScope,
    $injector
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
      _this.params = params;

      _this.errors = {
        synchronization: []
      };
      _this.data = [];
      _this.step = 'initialized';
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
      var $jsonapi = $injector.get('$jsonapi');
      var config = {
        action: 'all',
        params: _this.params
      };

      return _this.factory.synchronizer.synchronize(config).then(resolved, rejected, notify);

      function resolved(results) {
        $rootScope.$emit('angularJsonAPI:collection:fetch', 'resolved', results);

        _this.errors.synchronization = [];
        _this.data = $jsonapi.proccesResults(results.data);

        results.finish();

        return _this;
      }

      function rejected(results) {
        $rootScope.$emit('angularJsonAPI:collection:fetch', 'rejected', results);

        _this.errors.synchronization = results.errors;

        results.finish();

        return _this;
      }

      function notify(results) {
        $rootScope.$emit('angularJsonAPI:collection:fetch', 'notify', results);

        return _this;
      }
    }
  }
})();
