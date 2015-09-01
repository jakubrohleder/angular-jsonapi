(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPISynchronizerPrototype', AngularJsonAPISynchronizerPrototypeWrapper);

  function AngularJsonAPISynchronizerPrototypeWrapper($log) {

    AngularJsonAPISynchronizerPrototype.prototype.synchronize = synchronize;

    return AngularJsonAPISynchronizerPrototype;

    function AngularJsonAPISynchronizerPrototype(synchronizations) {
      var _this = this;

      _this.synchronizations = synchronizations;
    }

    function synchronize(config) {
      $log.debug('Synchro Collection', this.Model.prototype.schema.type, config);

      if (config.action === undefined) {
        $log.error('Can\'t synchronize undefined action', config);
      }
    }
  }
})();
