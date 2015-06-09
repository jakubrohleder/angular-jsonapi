(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIAbstractData', AngularJsonAPIAbstractDataWrapper);

  function AngularJsonAPIAbstractDataWrapper(
    $log,
    uuid4,
    lazyProperty,
    AngularJsonAPIAbstractDataForm
  ) {

    AngularJsonAPIAbstractData.prototype.__setData = __setData;
    AngularJsonAPIAbstractData.prototype.__setLinks   = __setLinks;
    AngularJsonAPIAbstractData.prototype.__setLink = __setLink;
    AngularJsonAPIAbstractData.prototype.__setAttributes = __setAttributes;
    AngularJsonAPIAbstractData.prototype.__validateData = __validateData;
    AngularJsonAPIAbstractData.prototype.__validateField = __validateField;
    AngularJsonAPIAbstractData.prototype.__updateAttributes = __updateAttributes;
    AngularJsonAPIAbstractData.prototype.__remove = __remove;
    AngularJsonAPIAbstractData.prototype.__setUpdated = __setUpdated;
    AngularJsonAPIAbstractData.prototype.__setLinkInternal = __setLinkInternal;

    AngularJsonAPIAbstractData.prototype.refresh = refresh;
    AngularJsonAPIAbstractData.prototype.remove = remove;
    AngularJsonAPIAbstractData.prototype.addLinkById = addLinkById;
    AngularJsonAPIAbstractData.prototype.addLink = addLink;
    AngularJsonAPIAbstractData.prototype.removeLink = removeLink;
    AngularJsonAPIAbstractData.prototype.toLink = toLink;
    AngularJsonAPIAbstractData.prototype.toPatchData = toPatchData;
    AngularJsonAPIAbstractData.prototype.removeAllLinks = removeAllLinks;
    AngularJsonAPIAbstractData.prototype.hasErrors = hasErrors;

    AngularJsonAPIAbstractData.prototype.toJson = toJson;

    return AngularJsonAPIAbstractData;

    function AngularJsonAPIAbstractData(data, updatedAt, dummy) {
      var _this = this;

      data.relationships = data.relationships || {};

      _this.removed = false;
      _this.loadingCount = 0;
      _this.data = {
        relationships: {},
        attributes: {}
      };
      _this.relationships = {};

      _this.errors = {
        validation: {}
      };

      _this.promises = {};

      _this.dummy = dummy || false;

      _this.__setUpdated(updatedAt);
      _this.__setData(data, updatedAt);

      _this.form = new AngularJsonAPIAbstractDataForm(_this);
    }

    function refresh() {
      var _this = this;

      _this.parentCollection.__synchronize('refresh', _this);
    }

    function hasErrors() {
      var _this = this;
      var result = false;

      angular.forEach(_this.errors, function(error) {
        if (error !== undefined) {
          result = true;
        }
      });

      return result;
    }

    function toJson() {
      var _this = this;

      return {
        data: _this.data,
        updatedAt: _this.updatedAt
      };
    }

    function __setUpdated(updatedAt) {
      var _this = this;

      _this.updatedAt = updatedAt || Date.now();
      _this.parentCollection.updatedAt = _this.updatedAt;
    }

    function __remove() {
      var _this = this;

      _this.__setUpdated();
      _this.removed = true;
      _this.removeAllLinks();
    }

    function remove() {
      var _this = this;

      _this.__remove();
      _this.parentCollection.remove(_this.data.id);
    }

    function toLink() {
      return {type: this.data.type, id: this.data.id};
    }

    function toPatchData() {
      var _this = this;
      var res = {data: {}};
      angular.forEach(_this.data, function(val, key) {
        if (key !== 'relationships') {
          res.data[key] = val;
        }
      });

      return res;
    }

    function addLinkById(linkKey, linkModelName, id) {
      var _this = this;
      var linkedObject = _this.linkedCollections[linkModelName].__get(id);

      if (_this.schema.relationships[linkKey] === undefined) {
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
      var linkSchema = _this.schema.relationships[linkKey];
      var linkType;
      var reflectionKey;
      var linkAttributes;

      if (linkedObject === undefined) {
        $log.error('Can\'t add non existing object');
        return;
      }

      if (linkSchema === undefined) {
        if (reflection === false) {
          $log.error('Can\'t add link not present in schema: ', linkKey, _this, reflection);
        }

        return;
      }

      if (linkSchema.polymorphic === false && linkSchema.model !== linkedObject.schema.type) {
        $log.error('This relation is not polymorphic, expected: ' + linkSchema.model + ' instead of ' + linkedObject.schema.type);
        return;
      }

      linkType = linkSchema.type;
      reflectionKey = linkSchema.reflection;

      if (linkType === 'hasOne') {
        linkAttributes = _this.data.relationships[linkKey].data;

        if (
          linkAttributes !== undefined &&
          linkAttributes !== null &&
          linkAttributes.id === linkedObject.data.id
        ) {
          return;
        }

        if (linkAttributes !== undefined && linkAttributes !== null) {
          $log.warn('Swaping hasOne', linkKey, 'of', _this.toString());
          _this.removeLink(linkKey);
        }

        linkAttributes = linkedObject.toLink();
      } else {
        linkAttributes = _this.data.relationships[linkKey].data || [];
        var duplicate = false;
        angular.forEach(linkAttributes, function(link) {
          if (link.id === linkedObject.data.id) {
            duplicate = true;
          }
        });

        if (duplicate === true) {
          return;
        }

        linkAttributes.push(linkedObject.toLink());
      }

      if (reflection === true) {
        _this.parentCollection.__synchronize('addLinkReflection', _this, linkKey, linkedObject);
      } else {
        linkedObject.addLink(reflectionKey, _this, true);
        _this.parentCollection.__synchronize('addLink', _this, linkKey, linkedObject);
      }

      _this.__setUpdated();
      _this.__setLinkInternal(linkAttributes, linkKey, linkSchema);
    }

    function removeAllLinks() {
      var _this = this;

      angular.forEach(_this.relationships, function(link, key) {
        _this.removeLink(key);
      });
    }

    function removeLink(linkKey, linkedObject, reflection) {
      var _this = this;
      var linkSchema = _this.schema.relationships[linkKey];
      var linkType;
      var linkAttributes;
      var reflectionKey;
      var removed = false;

      if (_this.schema.relationships[linkKey] === undefined) {
        $log.error('Can\'t remove link not present in schema');
        return;
      }

      linkType = linkSchema.type;
      reflectionKey = linkSchema.reflection;
      linkAttributes = _this.data.relationships[linkKey].data;

      if (linkType === 'hasOne') {
        if (linkedObject !== undefined && linkedObject.data.id === linkAttributes.id) {
          _this.data.relationships[linkKey].data = null;
          linkAttributes = null;
          removed = true;
          if (reflection !== true && _this.relationships[linkKey] !== undefined) {
            _this.relationships[linkKey].removeLink(reflectionKey, _this, true);
          }
        }
      } else {
        if (linkedObject === undefined) {
          _this.data.relationships[linkKey].data = [];
          linkAttributes = [];
          removed = true;
          if (reflection !== true) {
            angular.forEach(_this.relationships[linkKey], function(link) {
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
        _this.__setUpdated();

        if (reflection !== true) {
          _this.parentCollection.__synchronize('removeLink', _this, linkKey, linkedObject);
        } else {
          _this.parentCollection.__synchronize('removeLinkReflection',  _this, linkKey, linkedObject);
        }

        _this.__setLinkInternal(linkAttributes, linkKey, linkSchema);
      }
    }

    function __updateAttributes(validatedAttributes) {
      var _this = this;

      _this.__setUpdated();
      _this.__setAttributes(validatedAttributes);
      _this.parentCollection.__synchronize('update', _this);
    }

    function __setLinkInternal(linkAttributes, linkKey, linkSchema) {
      var _this = this;
      var linkType = linkSchema.type;
      var reflectionKey = linkSchema.reflection;

      if (linkAttributes === null) {
        delete _this.relationships[linkKey];
        _this.relationships[linkKey] = undefined;
      } else if (linkType === 'hasMany' && angular.isArray(linkAttributes)) {
        var getAll = function() {
          var result = [];
          angular.forEach(linkAttributes, function(link) {
            var linkedCollection = _this.linkedCollections[link.type];
            if (linkedCollection === undefined) {
              $log.error('No angular-jsonapi schema for', linkAttributes.type);
              return;
            }

            var linkedObject = linkedCollection.__get(link.id);
            linkedObject.addLink(reflectionKey, _this, true);

            result.push(linkedObject);
          });

          return result;
        };

        lazyProperty(_this.relationships, linkKey, getAll);
      } else if (linkType === 'hasOne' && linkAttributes !== null) {

        var getSingle = function() {
          var linkedCollection = _this.linkedCollections[linkAttributes.type];
          if (linkedCollection === undefined) {
            $log.error('No angular-jsonapi schema for', linkAttributes.type);
            return;
          }

          var linkedObject = linkedCollection.__get(linkAttributes.id);
          linkedObject.addLink(reflectionKey, _this, true);

          return linkedObject;
        };

        lazyProperty(_this.relationships, linkKey, getSingle);
      }
    }

    function __setLink(linkAttributes, linkKey, linkSchema) {
      var _this = this;
      var linkType = linkSchema.type;
      var reflectionKey = linkSchema.reflection;

      if (linkType === 'hasMany' && angular.isArray(linkAttributes)) {
        var indexedLinks = {};
        angular.forEach(linkAttributes, function(link) {
          indexedLinks[link.id] = link;
        });

        angular.forEach(_this.relationships[linkKey], function(link) {
          if (indexedLinks[link.data.id] === undefined) {
            link.removeLink(reflectionKey, _this, true);
          }
        });
      } else if (linkType === 'hasOne' && linkAttributes !== null) {
        if (_this.relationships[linkKey] !== undefined && _this.relationships[linkKey].data.id !== linkAttributes.id) {
          _this.relationships[linkKey].removeLink(reflectionKey, _this, true);
        }
      }

      _this.__setLinkInternal(linkAttributes, linkKey, linkSchema);
    }

    function __setLinks(relationships) {
      var _this = this;
      if (relationships === undefined) {
        return;
      }

      angular.forEach(_this.schema.relationships, function(linkSchema, linkName) {
        _this.data.relationships[linkName] = _this.data.relationships[linkName] || {};
        if (relationships[linkName] !== undefined) {
          angular.extend(_this.data.relationships[linkName], relationships[linkName]);
        }
      });

      angular.forEach(_this.schema.relationships, function(linkSchema, linkKey) {
        if (relationships[linkKey] !== undefined && relationships[linkKey].data !== undefined) {
          _this.__setLink(relationships[linkKey].data, linkKey, linkSchema);
        }
      });
    }

    function __validateField(data, key) {
      var _this = this;
      var error = [];

      if (data !== undefined) {
        error = __validate(_this.schema.attributes[key], data, key);
      }

      return error;
    }

    function __validateData(data) {
      var _this = this;
      var errors = {};

      angular.forEach(_this.schema.attributes, function(validator, key) {
        var error = _this.__validateField(data[key], key);
        if (error.length > 0) {
          errors[key] = error;
          $log.warn('Erorrs when validating ', data[key], errors);
        }
      });

      return errors;
    }

    function __setAttributes(attributes) {
      var _this = this;

      angular.forEach(_this.schema.attributes, function(validator, attributeName) {
        if (attributes[attributeName] !== undefined) {
          _this.data.attributes[attributeName] = attributes[attributeName];
        }
      });
    }

    function __setData(data) {
      var _this = this;
      var safeData = angular.copy(data);

      _this.errors.validation = _this.__validateData(safeData);

      safeData.relationships = safeData.relationships || {};
      safeData.attributes = safeData.attributes || {};

      _this.data.id = safeData.id;
      _this.data.type = safeData.type;

      _this.__setAttributes(safeData.attributes);
      _this.__setLinks(safeData.relationships);
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
          errors.push(attributeName + ' is too short min ' + validator.minlength);
        }

        if (validator.maxvalue !== undefined && parseInt(attributeValue) > validator.maxvalue) {
          errors.push(attributeName + ' is too big max ' + validator.maxvalue);
        }

        if (validator.minvalue !== undefined && parseInt(attributeValue) < validator.minvalue) {
          errors.push(attributeName + ' is too small min ' + validator.minvalue);
        }
      } else {
        $log.error('Wrong validator type: ' + validator.toString());
      }

      return errors;
    }

  }
})();
