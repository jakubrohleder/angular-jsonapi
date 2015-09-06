# Angular JsonAPI
<!--[![Code Climate](https://codeclimate.com/github/jakubrohleder/angular-jsonapi/badges/gpa.svg)](https://codeclimate.com/github/jakubrohleder/angular-jsonapi)-->

### Use with caution!
### This module is still in a WIP state, many things work fine but it lacks tests and API may change, also documentation can not reflect the real state

Simple and lightweight, yet powerfull ORM for your frontend that seamlessly integrates with your JsonAPI server.

This module provides the following features:

* Converting JsonApi resonses into data objects
* Creating new objects
* Removing existing objects
* Synchronizing objects with multiple sources (currently local-store and RESTApi)
* Validating object forms
* Caching object for instant/offline presentation

The future development plan involves:

* Web-socket support
* Full offline-mode support with custom data synchronization strategies
* Even easier usage!

# Table of Contents

* [x] [About this module](#about-this-module)
* [ ] [Demo](#demo)
* [x] [Installation](#installation)
* [x] [Configuration](#configuration)
 	* [x] [Schema](#schema)
	   * [x] [Validators schema](#validators-schema)
	   * [x] [Relationship schema](#relationship-schema)
	   * [x] [Include schema](#custom-functions-schema)
	   * [x] [Custom functions schema](#custom-functions-schema)
	* [x] [Synchronizations](#synchronizations)
	   * [ ] [Own synchronizations](#own-synchronizations)
	* [x] [Synchronizators](#synchronizators)
	   * [ ] [Own synchronizators](#own-synchronizators)
	* [x] [Model](#model)
* [ ] [API](#api)
	* [ ] [New object](#new-object) 
	* [ ] [Requests](#requests)
	* [ ] [Forms](#forms)
	* [ ] [Synchronizations API](#synchronizations-api)
	* [ ] [Errors handling](#errors-handling)
* [ ] [Roadmap](#using-alternate-response-formats)

# About this module

The idea behind this module is to make those boring and generic data manipulations stuff easy. No more problems with complex data structure, synchronizing data with the server, caching objects or recreating relationships.

# Demo

### [Live demo] (http://jakubrohleder.github.io/angular-jsonapi)

### Local

* Clone this module and install npm/bower dependencies:

~~~bash
git clone git@github.com:jakubrohleder/angular-jsonapi.git
cd angular-jsonapi
npm install
~~~

* Run demo server

~~~bash
# from angular-jsonapi root directory
gulp serve
~~~

# Installation

* Download this module and its dependencies:

~~~bash
# from the terminal at the root of your project
bower install angular-jsonapi --save
~~~
  
* Include `angular-jsonapi` and synchronization modules (`angular-jsonapi-rest`, `angular-jsonapi-local`) in your module's dependencies:
  
~~~javascript
// in your js app's module definition
angular.module('myApp', [
	'angular-jsonapi',
	'angular-jsonapi-rest',
	'angular-jsonapi-local'
]);
~~~

# Configuration

Although `$jsonapiProvider` is injected during app configuration phase currently it does not have any confiuration options. All the configuration shoud be made in the `run` phase using `$jsonapi`. The only option as the moment is `$jsonapi.addModel`, it takes two arguments: [schema](#schema) and [synchronizer](#synchronizers). 

## Schema

First step is to provide data schema, that is used later on to create objects, validate forms etc. Each data type should have it's own schema. The schema is an object containing following properties:

| field | description |
|---|---|
| **type** | Type of an object must be the same as the one in the JSON API response. Should be in plural. |
| **id** | Type of id field, currenty only `uuid4` is supported. |
| **attributes** | Object with the model attributes names as keys and [validators](#validators) as values. |
| **relationships** | Object with the model relationships names as keys and [relationship schema](#relationship-schema) as values. |
| **include** | Object with extra values that should be included in the `get` or `all` request. |
| **functions** | Object with functions names as keys and [custom functions](#custom-functions) as values. |

For example schema for a Novel model can look like this:

~~~javascript
var novelsSchema = {
  type: 'novels',
  id: 'uuid4',
  attributes: {
    title: ['required', 'string', {minlength: 3}, {maxlength: 50}],
    part: ['integer', {maxvalue: 10, minvalue: 1}]
  },
  relationships: {
    author: {
      included: true,
      type: 'hasOne',
      model: 'people'
    },
    characters: {
      included: true,
      type: 'hasMany',
      reflection: 'apearences'
    }
  },
  include: {
    all: [
      'characters'
    ],
    get: [
      'characters.friends'
    ]
  },
  functions: {
    toString: function() {
      return this.data.attributes.title;
    }
  }
};
~~~

### Validators schema

#### Defined validators

Angular-jsonapi supports multiple validators, as well as gives you opportunity to use your own. Validators can be supplied as as an string, object or function and grouped in arrays. Currently following validators are supported:

| validator | description |
|---|---|
|`'text'` or `'string'` | Checks if the field is string using `angular.isString`. |
|`'number'` or `'integer'` | Checks if the field is a number. |
|`'uuid4'` | Checks if the field contains uuid4 value using `angular-uuid4.validate`. |
|`'required'` | Checks if the field contains any data (works for strings, integers etc.). |
|`{maxlength: value}` and `{minlenght: value}` | Checks if the field content is shorter/longer or equal to `value`. |
|`{maxvalue: value}` and `{minvalue: value}` | Checks if the field value is lower/higher or equal to `value`. Works only on intergers. |
| **custom** | Any function can be passed as a validator, learn more in [custom validators](#custom-validators) section. |

All errors messages are in english and `i18n` is not supported right now, but it is on the [roadmap](#roadmap).

#### Custom validators

If you need more complex validation method, you can use your own function as a validator. Such function should take a `attributeValue` and `attributeName` as arguments and return an array of errors, or an empty array if it value passes validation.

~~~javascript
//(...)
  id: 'uuid4',
  attributes: {
    title: awesomeValidator,
    part: ['integer', {maxvalue: 10, minvalue: 1}]
  }
//(...)

function awesomeValidator(attributeValue, attributeName) {
  if (attributeValue !== 'awesome') {
    return [attributeName + ' is not awesome'];
  }
  
  return [];
}
~~~

### Relationship schema

Each relationship is decribed by separate schema with following properties:

| property | default value | description |
|---|---|---|
| `type ` | **required**  | Type of the relationship, either `hasMany` or `hasOne`. |
| `model` | pluralized raltionship name  | Type of the model that this relationship can be linked to, not checked if `polymorphic` is set `true`. |
| `polymorphic ` | `false`  | Can the relationship link to objects with different type? |
| `reflection ` | object type  | Name of the inversed relationship in the related object. If set to `false` the relationship will not update inversed relationship in the related object. |
| `included ` | `true` for `hasOne`, `false` for `hasMany`  | Should the related resource be returned in the `GET` request as well. **Does not affect `ALL` requests!** If you want to extra resources to be returned with `ALL` request use [include schema](#include-schema).  |

### Include schema

Include schema object should have not more then two properties, one for each type of request: `all` and `get`. Each property value should be an array of relationship names. Each of this names will be added to all request of certain type. In example with configuration:

~~~javascript
//(...)
  include: {
    all: [
      'characters'
    ],
    get: [
      'characters.friends'
    ]
  },
//(...)
~~~

All `get` requests will look like this:

~~~
GET /novels/1?include=characters.friends HTTP/1.1
Accept: application/vnd.api+json
~~~

### Custom functions schema

Custom functions schema is nothing more they just simple object with function names as keys and functions as a value. All of the functions will be runned with an object instance binded to `this` and no arguments. 

Custom functions are extremly helpfull if you need to inject some methods common for the object type into its prototype.

## Synchronizers

Synchronizers are object that keep synchronizations work together by running hooks in the right order, as well as creating the final data that is used to update object.

In most cases `AngularJsonAPISynchronizerSimple` is enought. But if for example, you synchronize data with two REST sources at the same time and have to figure out which of the responses is up-to-date, you should write your own synchronizer.

`AngularJsonAPISynchronizerSimple` constructor takes one argument - array of [synchronizations] (#synchronizations).

~~~javascript
    var novelsSynchronizer = new AngularJsonAPISynchronizerSimple([
      localeSynchronization, restSynchronization
    ]);
~~~

### Own Synchronizers

**todo**

## Synchronizations

Synchronizations are strategies of updating model with given source. At the moment two synchronization types are supported:

### AngularJsonAPISynchronizationLocal
Saves data in the local store and loads them each time you visit the site, in this way your users can access data immidiately even if they are offline. All the data are cleared when the users logs out.

Date is saved each time it changes and loaded during initialization of the module.

To use this synchronization you must include `angular-jsonapi-local` in your module dependencies.

Synchronization constructor takes one argument - prefix for local store objects, default value is `AngularJsonAPI`.

~~~javascript

var localeSynchro = new AngularJsonAPISynchronizationLocal('AngularJsonAPI');

~~~

### AngularJsonAPISynchronizationRest
Is a simple synchronizator with the RESTAPI supporting JSON API format. It performs following operations:
`remove`, `unlink`, `link`, `update`, `add`, `all`, `get`. Everytime the data changes the suitable request is made to keep your data synchronized.

To use this synchronization you must include `angular-jsonapi-rest` in your module dependencies.

Synchronization constructor takes one argument - `url` of the resource, there is no default value.

~~~javascript

var novelsSynchro = new AngularJsonAPISynchronizationRest('localhost:3000/novels');

~~~

### Own synchronizations

**todo**

## Model

After performing `$jsonapi.addModel(schema, synchronizer);` the model factory is accesible by return `$jsonapi.getModel(schema.type);`. The easiest way to use it is to create `angular.factory` for each model and then inject it to your controllers. 

All in all configuration of the factory for novels can look like this:

~~~javascript
(function() {
  'use strict';

  angular.module('angularJsonapiExample')
  
  .run(function(
    $jsonapi,
    AngularJsonAPISynchronizationLocal,
    AngularJsonAPISynchronizationRest,
    AngularJsonAPISynchronizerSimple
  ) {
    var novelsSchema = {
      type: 'novels',
      id: 'uuid4',
      attributes: {
        title: ['required', 'string', {minlength: 3}, {maxlength: 50}],
        part: ['integer', {maxvalue: 10, minvalue: 1}]
      },
      relationships: {
        author: {
          included: true,
          type: 'hasOne',
          model: 'people'
        }
      }
    };

    var localeSynchronization = new AngularJsonAPISynchronizationLocal('AngularJsonAPI');
    var restSynchronization = new AngularJsonAPISynchronizationRest('/novels');
    var novelsSynchronizer = new AngularJsonAPISynchronizerSimple([
      localeSynchronization, restSynchronization
    ]);

    $jsonapi.addModel(novelsSchema, novelsSynchronizer);
  })
  .factory('Novels', Novels);

  function Novels(
    $jsonapi
  ) {
    return $jsonapi.getModel('novels');
  }
})();
~~~

# API

## New object

## Requests

## Forms

## Synchronizations API

## Errors handling

# Roadmap


r