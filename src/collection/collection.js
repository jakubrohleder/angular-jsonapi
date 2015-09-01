(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPICollection', AngularJsonAPICollectionWrapper);

  function AngularJsonAPICollectionWrapper(

  ) {

    AngularJsonAPICollection.prototype.refresh = refresh;

    return AngularJsonAPICollection;

    function AngularJsonAPICollection(factory, filter) {
      var _this = this;

      _this.factory = factory;
      _this.filter = filter;

      _this.errors = {
        synchronization: []
      };
      _this.data = [];
      _this.step = 'initialized';

      _this.refresh();
    }

    function refresh() {
      var _this = this;
      var config = {
        method: 'all',
        filter: _this.filter
      };

      _this.promise = _this.factory.__synchronize(config).then(resolved, rejected, notify);

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
