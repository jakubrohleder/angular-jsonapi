(function() {
  'use strict';

  angular.module('angularJsonapi')
  .factory('AngularJsonAPIAbstractData', AngularJsonAPIAbstractDataWrapper);

  function AngularJsonAPIAbstractDataWrapper($q, $rootScope, $log, uuid4, AngularJsonAPIAbstractDataForm, lazyProperty) {

    AngularJsonAPIAbstractData.prototype.__setData = __setData;
    AngularJsonAPIAbstractData.prototype.__setLinks   = __setLinks;
    AngularJsonAPIAbstractData.prototype.__setLink = __setLink;
    AngularJsonAPIAbstractData.prototype.__validateData = __validateData;
    AngularJsonAPIAbstractData.prototype.__validateField = __validateField;
    AngularJsonAPIAbstractData.prototype.__synchronize = __synchronize;
    AngularJsonAPIAbstractData.prototype.__update = __update;
    AngularJsonAPIAbstractData.prototype.__remove = __remove;

    AngularJsonAPIAbstractData.prototype.refresh = refresh;
    AngularJsonAPIAbstractData.prototype.remove = remove;
    AngularJsonAPIAbstractData.prototype.addLinkById = addLinkById;
    AngularJsonAPIAbstractData.prototype.addLink = addLink;
    AngularJsonAPIAbstractData.prototype.removeLink = removeLink;
    AngularJsonAPIAbstractData.prototype.toLink = toLink;
    AngularJsonAPIAbstractData.prototype.removeAllLinks = removeAllLinks;

    AngularJsonAPIAbstractData.prototype.serialize = serialize;

    return AngularJsonAPIAbstractData;

    function AngularJsonAPIAbstractData(data) {
      var _this = this;

      _this.removed = false;
      _this.data = {};
      _this.links = {};

      _this.errors = {
        validation: {}
      };

      _this.dummy = data.id === undefined;

      _this.__setData(data);
      data.links = data.links || {};
      _this.__setLinks(data.links);
      _this.form = new AngularJsonAPIAbstractDataForm(_this);
    }

    function refresh() {
      var _this = this;

      _this.__synchronize('refresh');
    }

    function serialize() {
      var _this = this;

      return {
        data:angular.toJson(_this.data)
      };
    }

    function __remove() {
      var _this = this;

      _this.removed = true;
      _this.removeAllLinks();
    }

    function remove() {
      var _this = this;

      _this.__remove();
      _this.parentCollection.remove(_this.data.id);

      _this.__synchronize('remove');
    }

    function toLink() {
      return {type: this.data.type, id: this.data.id};
    }

    function addLinkById(linkKey, linkModelName, id) {
      var _this = this;
      var linkedObject = _this.linkedCollections[linkModelName].__get(id);

      if (_this.schema.links[linkKey] === undefined) {
        $log.error('Cannot add link not specified in schema: ' + linkKey);
        return;
      }

      if (_this.linkedCollections[linkModelName] === undefined) {
        $log.error('Cannot add link of not existing type: ' + linkModelName);
        return;
      }

      if (!uuid4.validate(id)) {
        $log.error('Wrong link id, not uuid4: ' + id);
        return;
      }

      if (linkedObject === undefined) {
        $log.error('Cant find', linkModelName, 'with', id);
        return;
      }

      _this.addLink(
        linkKey,
        linkedObject
      );

    }

    function addLink(linkKey, linkedObject, reflection) {
      var _this = this;
      var linkSchema = _this.schema.links[linkKey];
      var linkType;
      var reflectionKey;
      var linkAttributes;

      if (linkedObject === undefined) {
        $log.error('Can\'t add non existing object');
        return;
      }

      if (linkSchema === undefined) {
        $log.error('Can\'t add link not present in schema: ', linkKey, _this, reflection);
        return;
      }

      if (linkSchema.polymorphic === false && linkSchema.model !== linkedObject.schema.type) {
        $log.error('This relation is not polymorphic, expected: ' + linkSchema.model + ' instead of ' + linkedObject.schema.type);
        return;
      }

      linkType = linkSchema.type;
      reflectionKey = linkSchema.reflection;
      linkAttributes = _this.data.links[linkKey].linkage;

      if (linkType === 'hasOne') {
        if (linkAttributes !== undefined && linkAttributes !== null) {
          $log.warn('Swaping hasOne', linkKey, 'of', _this.toString());
          _this.removeLink(linkKey);
        }

        _this.data.links[linkKey].linkage = linkedObject.toLink();
        linkAttributes = linkedObject.toLink();
      } else {
        _this.data.links[linkKey].linkage.push(linkedObject.toLink());
      }

      if (reflection === true) {
        _this.__synchronize('addLinkReflection');
      } else {
        linkedObject.addLink(reflectionKey, _this, true);
        _this.__synchronize('addLink');
      }

      _this.__setLink(linkAttributes, linkKey, linkType);
    }

    function removeAllLinks() {
      var _this = this;

      angular.forEach(_this.links, function(link, key) {
        _this.removeLink(key);
      });
    }

    function removeLink(linkKey, linkedObject, reflection) {
      var _this = this;
      var linkSchema = _this.schema.links[linkKey];
      var linkType;
      var linkAttributes;
      var reflectionKey;
      var removed = false;

      if (_this.schema.links[linkKey] === undefined) {
        $log.error('Can\'t remove link not present in schema');
        return;
      }

      linkType = linkSchema.type;
      reflectionKey = linkSchema.reflection;
      linkAttributes = _this.data.links[linkKey].linkage;

      if (linkType === 'hasOne') {
        if (linkedObject === undefined || linkedObject.data.id === linkAttributes.id) {
          _this.data.links[linkKey].linkage = null;
          linkAttributes = null;
          removed = true;
          if (reflection !== true) {
            _this.links[linkKey].removeLink(reflectionKey, _this, true);
          }
        }
      } else {
        if (linkedObject === undefined) {
          _this.data.links[linkKey].linkage = [];
          linkAttributes = [];
          removed = true;
          if (reflection !== true) {
            angular.forEach(_this.links[linkKey], function(link) {
              link.removeLink(reflectionKey, _this, true);
            });
          }
        } else {
          angular.forEach(linkAttributes, function(link, index) {
            if (link.id === linkedObject.data.id) {
              if (reflection !== true) {
                linkedObject.removeLink(reflectionKey, _this, true);
              }

              linkAttributes.splice(index, 1);
              removed = true;
            }
          });
        }
      }

      if (removed === true) {
        if (reflection !== true) {
          _this.__synchronize('removeLink');
        } else {
          _this.__synchronize('removeLinkReflection');
        }

        _this.__setLink(linkAttributes, linkKey, linkType);
      }
    }

    function __update(validatedData) {
      var _this = this;

      if (validatedData.id) {
        $log.error('Cannot change id of ', _this);
        delete validatedData.id;
      }

      if (validatedData.type) {
        $log.error('Cannot change type of ', _this);
        delete validatedData.type;
      }

      _this.__setData(validatedData);
      _this.__synchronize('update');
    }

    function __setLink(linkAttributes, linkKey, linkType) {
      var _this = this;

      if (linkAttributes === null) {
        delete _this.links[linkKey];
        _this.links[linkKey] = undefined;
      } else if (linkType === 'hasMany' && angular.isArray(linkAttributes)) {
        var getAll = function() {
          var result = [];
          angular.forEach(linkAttributes, function(link) {
            result.push(_this.linkedCollections[link.type].__get(link.id));
          });

          return result;
        };

        lazyProperty(_this.links, linkKey, getAll);
      } else if (linkType === 'hasOne' && linkAttributes.id) {
        var getSingle = function() {
          return _this.linkedCollections[linkAttributes.type].__get(linkAttributes.id);
        };

        lazyProperty(_this.links, linkKey, getSingle);
      }
    }

    function __setLinks(links) {
      var _this = this;

      angular.forEach(_this.schema.links, function(linkSchema, linkKey) {
        if (links[linkKey] !== undefined) {
          _this.__setLink(links[linkKey].linkage, linkKey, linkSchema.type);
        }
      });
    }

    function __validateField(data, key) {
      var _this = this;
      var error = [];

      if (key !== 'links' && key !== 'type' && data !== undefined) {
        error = __validate(_this.schema[key], data, key);
      }

      return error;
    }

    function __validateData(data) {
      var _this = this;
      var errors = {};

      angular.forEach(_this.schema, function(validator, key) {
        var error = _this.__validateField(data[key], key);
        if (error.length > 0) {
          errors[key] = error;
          $log.warn('Erorrs when validating ', data[key], errors);
        }
      });

      return errors;
    }

    function __setData(data) {
      var _this = this;
      var safeData = angular.copy(data);
      _this.errors.validation = _this.__validateData(data);

      safeData.links = safeData.links || {};
      angular.forEach(_this.schema.links, function(linkSchema, linkName) {
        if (linkSchema.type === 'hasOne') {
          safeData.links[linkName] = safeData.links[linkName] || {linkage: null};
        } else {
          safeData.links[linkName] = safeData.links[linkName] || {linkage: []};
        }
      });

      angular.forEach(_this.schema, function(validator, attributeName) {
        if (data[attributeName]) {
          _this.data[attributeName] = safeData[attributeName];
        }
      });
    }

    function __validate(validator, attributeValue, attributeName) {
      var errors = [];
      if (angular.isArray(validator)) {
        angular.forEach(validator, function(element) {
          errors = errors.concat(__validate(element, attributeValue, attributeName));
        });
      } else if (angular.isFunction(validator)) {
        var err = validator(attributeValue);
        if (angular.isArray(err)) {
          errors.concat(err);
        } else {
          $log.error(
            'Wrong validator type it should return array of errors instead of: ' +
              err.toString()
          );
        }
      } else if (angular.isString(validator)) {
        if (validator === 'text' || validator === 'string') {
          if (!angular.isString(attributeValue)) {
            errors.push(attributeName + ' is not a string ');
          }
        } else if (validator === 'number' || validator === 'integer') {
          if (parseInt(attributeValue).toString() !== attributeValue.toString()) {
            errors.push(attributeName + ' is not a number');
          }
        } else if (validator === 'uuid4') {
          if (!uuid4.validate(attributeValue)) {
            errors.push(attributeName + ' is not a uuid4');
          }
        } else if (validator === 'required') {
          if (attributeValue.toString().length === 0) {
            errors.push(attributeName + ' is empty');
          }
        } else {
          $log.error('Wrong validator type: ' + validator.toString());
        }
      } else if (angular.isObject(validator)) {
        if (validator.maxlength !== undefined && attributeValue.length > validator.maxlength) {
          errors.push(attributeName + ' is too long max ' + validator.maxlength);
        }

        if (validator.minlength !== undefined && attributeValue.length < validator.minlength) {
          errors.push(attributeName + ' is too short max ' + validator.minlength);
        }

        if (validator.maxvalue !== undefined && parseInt(attributeValue) > validator.maxvalue) {
          errors.push(attributeName + ' is too big max ' + validator.maxvalue);
        }

        if (validator.minvalue !== undefined && parseInt(attributeValue) < validator.minvalue) {
          errors.push(attributeName + ' is too small max ' + validator.minvalue);
        }
      } else {
        $log.error('Wrong validator type: ' + validator.toString());
      }

      return errors;
    }

    function __synchronize(key) {
      var _this = this;

      if (!_this.removed) {
        $log.log('Synchro', _this.schema.type, _this.toString(), key);
        $log.log(_this.synchronizationHooks[key]);
      }
    }

  }
})();
