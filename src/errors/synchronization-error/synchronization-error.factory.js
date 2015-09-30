(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModelSynchronizationError', AngularJsonAPIModelSynchronizationErrorWrapper);

  function AngularJsonAPIModelSynchronizationErrorWrapper() {
    SynchronizationError.prototype = Object.create(Error.prototype);
    SynchronizationError.prototype.constructor = SynchronizationError;
    SynchronizationError.prototype.name = 'SynchronizationError';

    return {
      create: SynchronizationErrorFactory
    };

    function SynchronizationErrorFactory(message, synchronization, code, action) {
      return new SynchronizationError(message, synchronization, code, action);
    }

    function SynchronizationError(message, synchronization, code, action) {
      var _this = this;
      Error.captureStackTrace(_this, _this.constructor);

      _this.message = message;
      _this.context = {
        synchronization: synchronization,
        code: code,
        action: action
      };
    }
  }
})();
