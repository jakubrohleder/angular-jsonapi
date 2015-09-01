(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPICollection', AngularJsonAPICollectionWrapper);

  function AngularJsonAPICollectionWrapper(

  ) {

    AngularJsonAPICollection.prototype.fetch = fetch;
    AngularJsonAPICollection.prototype.refresh = fetch;

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
     * Synchronizes collection with the server
     * @return {promise} Promise associated with synchronization that resolves to this
     */
    function fetch() {
      var _this = this;
      var config = {
        method: 'all',
        params: _this.params
      };

      return _this.factory.__synchronize(config).then(resolved, rejected, notify);

      function resolved(data) {
        _this.errors.synchronization = [];
        _this.data = data;

        return _this;
      }

      function rejected(errors) {
        _this.errors.synchronization = errors;

        return _this;
      }

      function notify(data, step) {
        if (data !== undefined) {
          _this.data = data;
        }

        _this.step = step;

        return _this;
      }
    }
  }
})();
