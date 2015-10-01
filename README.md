# Angular JsonAPI

[![Code Climate](https://codeclimate.com/github/jakubrohleder/angular-jsonapi/badges/gpa.svg)](https://codeclimate.com/github/jakubrohleder/angular-jsonapi)

## Use with caution it's only 1.0.0-alpha.2

*This module is still in a WIP state, many things work fine but it lacks tests and API may change, also documentation can not reflect the real state*

*To see all of the features in action run and study the demo.*

Simple and lightweight, yet powerfull ORM for your frontend that seamlessly integrates with your JsonAPI server.

# [Live demo](http://jakubrohleder.github.io/angular-jsonapi)

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

<!-- MarkdownTOC depth=2 -->

- [About this module](#about-this-module)
- [Demo](#demo)
  - [Live demo](#live-demo)
  - [Local](#local)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Schema](#schema)
  - [Synchronizers](#synchronizers)
  - [Synchronizations](#synchronizations)
  - [Wrap up](#wrap-up)
- [API](#api)
  - [`$jsonapi`](#jsonapi)
  - [Resource](#resource)
  - [Collection](#collection)
  - [Object](#object)
  - [Errors](#errors)
- [Directives](#directives)
  - [Promise-button](#promise-button)
- [Roadmap](#roadmap)
  - [1.0.0-alpha.3](#100-alpha3)
  - [1.0.0-beta.1](#100-beta1)
  - [1.0.0-beta.2](#100-beta2)
  - [1.0.0](#100)
  - [> 1.0.0 (ideas)](#-100-ideas)

<!-- /MarkdownTOC -->

# About this module

The idea behind this module is to make those boring and generic data manipulations stuff easy. No more problems with complex data structure, synchronizing data with the server, caching objects or recreating relationships.

# Demo

## [Live demo](http://jakubrohleder.github.io/angular-jsonapi)

## Local

* Install and run the backend module: [jsonapi-robot-wars](https://github.com/jakubrohleder/jsonapi-robot-wars)

* Clone this module and install npm/bower dependencies:

~~~bash
git clone git@github.com:jakubrohleder/angular-jsonapi.git
cd angular-jsonapi
npm install
~~~

* Run demo server from `angular-jsonapi` root directory:

~~~bash
gulp serve
~~~

# Installation

* Download this module and its dependencies from the terminal at the root of your project:

~~~bash
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

Although `$jsonapiProvider` is injected during app configuration phase currently it does not have any confiuration options. All the configuration shoud be made in the `run` phase using `$jsonapi`. The only option as the moment is `$jsonapi.addResource`, it takes two arguments: [schema](#schema) and [synchronizer](#synchronizers).

## Schema

First step is to provide data schema, that is used later on to create objects, validate forms etc. Each data type should have it's own schema. The schema is an object containing following properties:

| field | description |
|---|---|
| **type** | Type of an object must be the same as the one in the JSON API response. Should be in plural. |
| **id** | Must be a string. |
| **attributes** | Object with the model attributes names as keys and [validation constraints](#validators) as values. |
| **relationships** | Object with the model relationships names as keys and [relationship schema](#relationship-schema) as values. |
| **include** | Object with extra values that should be included in the `get` or `all` request. |
| **functions** | Object with functions names as keys and [custom functions](#custom-functions) as values. |

For example schema for a Novel model can look like this:

~~~javascript
var novelsSchema = {
  type: 'novels',
  id: '',
  attributes: {
    title: {presence: true, length: {maximum: 20, minimum: 3}},
    part: {presence: true, numericality: {onlyInteger: true}}
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

Angular-jsonapi supports multiple validators through [Validate.js](http://validatejs.org/) library. In the schema each attribute key should correspond to an object with validation constrains for this attribute. Constraints must follow the schema described at [http://validatejs.org/#constraints](http://validatejs.org/#constraints).

**Asynchronous validators** are supported!

The [Validate.js](http://validatejs.org/) library currently supports following validators of the box:

* [Presence](http://validatejs.org/#validators-presence)
* [Length](http://validatejs.org/#validators-length)
* [Numericality](http://validatejs.org/#validators-numericality)
* [Datetime](http://validatejs.org/#validators-datetime)
* [Date](http://validatejs.org/#validators-date)
* [Format](http://validatejs.org/#validators-format)
* [Inclusion](http://validatejs.org/#validators-inclusion)
* [Exclusion](http://validatejs.org/#validators-exclusion)
* [Email](http://validatejs.org/#validators-email)
* [Equality](http://validatejs.org/#validators-equality)

You can also write your own validator, for more information read [Custom Validators section](#custom-validators).

#### Custom validators

If you need more complex validation method, you can use your own function as a validator. As whole validator module it utilies `validate.js` library.

##### Normal

> Writing your own validator is super simple! Just add it to the validate.validators object and it will be automatically picked up.

> The validator receives the following arguments:

> * **value** - The value exactly how it looks in the attribute object.
> * **options** - The options for the validator. Guaranteed to not be null or undefined.
> * **key** - The attribute name.
> * **attributes** - The entire attributes object.
>
>If the validator passes simply return null or undefined. Otherwise return a string or an array of strings containing the error message(s).
>Make sure not to append the key name, this will be done automatically.

To maintain dependency injection schema there is `$jsonapi.addValidator(validatorName, validatorFun)` method that wraps this behaviour.

~~~javascript
$jsonapi.addValidator('customValidator', customValidator);

var novelsSchema = {
// (...)
  attributes: {
    title: {presence: true, length: {maximum: 20, minimum: 3}, customValidator: "some options"}
// (...)

function customValidator(value, options, key, attributes) {
  console.log(value);
  console.log(options);
  console.log(key);
  console.log(attributes);
  return "is totally wrong";
};

~~~

For more information read [http://validatejs.org/#custom-validator](http://validatejs.org/#custom-validator).

##### Async

> Async validators are equal to a regular one in every way except in what they return. An async validator should return a promise (usually a validate.Promise instance).
>
> The promise should be resolved with the error (if any) as its only argument when it's complete.
>
> If the validation could not be completed or if an error occurs you can call the reject handler with an Error which will make the whole validation fail and be rejected.

For more information read [http://validatejs.org/#custom-validator-async](http://validatejs.org/#custom-validator-async).

### Relationship schema

Each relationship is decribed by separate schema with following properties:

| property | default value | description |
|---|---|---|
| `type ` | **required**  | Type of the relationship, either `hasMany` or `hasOne`. |
| `model` | pluralized raltionship name  | Type of the model that this relationship can be linked to, not checked if `polymorphic` is set `true`. |
| `polymorphic ` | `false`  | Can the relationship link to objects with different type? |
| `reflection ` | object type  | Name of the inversed relationship in the related object. If set to `false` the relationship will not update inversed relationship in the related object. |
| `included ` | `true` for `hasOne`, `false` for `hasMany`  | Should the related resource be returned in the `GET` request as well. **Does not affect `ALL` requests!** If you want to extra resources to be returned with `ALL` request use [include schema](#include-schema).  |

If you want all of the properties (besides type) to have default value, you can shorten the schema to just `'hasOne'` or `'hasMany'`.

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

~~~http
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

### Custom Synchronizer

todo

## Synchronizations

Synchronizations are strategies of updating model with given source. At the moment two synchronization types are supported:

### AngularJsonAPISynchronizationLocal

Saves data in the local store and loads them each time you visit the site, in this way your users can access data immidiately even if they are offline. All the data are cleared when the users logs out.

Date is saved each time it changes and loaded during initialization of the module.

To use this synchronization you must include `angular-jsonapi-local` in your module dependencies.

Synchronization constructor takes one argument - prefix for local store objects, default value is `AngularJsonAPI`.

~~~javascript
var localeSynchro = new AngularJsonAPISynchronizationLocal('LocalStore synchronization', 'AngularJsonAPI');

~~~

### AngularJsonAPISynchronizationRest

Is a simple synchronizator with the RESTAPI supporting JSON API format. It performs following operations:
`remove`, `unlink`, `link`, `update`, `add`, `all`, `get`. Everytime the data changes the suitable request is made to keep your data synchronized.

To use this synchronization you must include `angular-jsonapi-rest` in your module dependencies.

Synchronization constructor takes one argument - `url` of the resource, there is no default value.

~~~javascript
var novelsSynchro = new AngularJsonAPISynchronizationRest('Rest synchronization', 'localhost:3000/novels');

~~~

### Custom Synchronizations

todo

## Wrap up

After performing `$jsonapi.addResource(schema, synchronizer);` the resource is accesible by `$jsonapi.getResource(type);`. The easiest way to use it is to create `angular.factory` for each model and then inject it to your controllers.

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
      id: '',
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

    var localeSynchronization = new AngularJsonAPISynchronizationLocal('LocalStore synchronization', 'AngularJsonAPI');
    var restSynchronization = new AngularJsonAPISynchronizationRest('Rest synchronization', '/novels');
    var novelsSynchronizer = new AngularJsonAPISynchronizerSimple([
      localeSynchronization, restSynchronization
    ]);

    $jsonapi.addResource(novelsSchema, novelsSynchronizer);
  })
  .factory('Novels', Novels);

  function Novels(
    $jsonapi
  ) {
    return $jsonapi.getResource('novels');
  }
})();
~~~

# API

## `$jsonapi`

`$jsonapi` as the main factory of the package  has few methods that will help you with creating and managing resources.

### Adding resource

`$jsonapi.addResource(schema, synchronizer)`

You can read about the method at [configuration section](#configuration).

### Getting resource

`$jsonapi.getResource(type)`

Returns a resource with the given `type`. If no resource with `type` has beed added before returns `undefined`.

### All resources

`$jsonapi.allResources()`

Returns object with all resources indexed by `type`.

### Listing resources

`$jsonapi.listResources()`

Returns array with all resources `types`.

### Clearing cache

`$jsonapi.listResources()`

Runs `clearCache` for each resource. [Read more] (#resource-clear-cache)

### Adding validator

`$jsonapi.addValidator(name, validator)`

Adds validator to validates object schema. [Read more] (#custom-validators)

## Resource

After configuration phase resources are the main object your application will oparete with. They represent one class of objects (e.g. Users or Comments). They are cappable of most operation that you expect REST API to perform.

### Properties

Each resource let you access following attributes:

* **initialized** - states the resource has been already initialized. Usable if `init` synchronization of resource is asynchronouse. Read more (todo)
* **type** - type of the resource
* **schema** - resource schema

This attributes shouldn't be modified.

### Getting object

`resource.get(id, params)`

Objects can be accessed by resource using `resource.get(id, params)`. It returns an [**object**](#object) with given id stored in the memory, at the same time `get` synchronization is triggered so the object data is synchronized with the server.

#### Params

Params may be be an object that can contain keys:

* **include** - string with comma delimited relationships that will override schema settings.

Include key supported explicitly, but other keys will also be passed to the synchronization.

**If params are ommited `undefined` default params (taken from schema) are used.**

### All objects

`resource.all(params)`

All object can be accessed by resource using `resource.all(params)`. It returns a [**collection**](#collection) with all objects of resource type stored in the memory, at the same time `all` synchronization is triggered so the objects data are synchronized with the server.
Promise can be accessed as resource.all(params).$promise

#### Params

Params must be an object that can contain keys:

* **include** - string with comma delimited relationships that will override schema settings.
* **filter** - object with `attribute: filter` values.

Those two keys are supported explicitly, but other keys will also be passed to the synchronization

**If params are ommited `undefined` default params (taken from schema) are used.**

### Removing object

`resource.remove(id)`

Removes object with given `id`, promise associated with synchronization is returned.

### Initializing new object

`resource.initialize()`

Initializes a new [**object**](#object). It can be filled up by editing its [form](#object-form) and synchronized later on.

### Clearing cache[resource-clear-cache]

`resource.clearCache()`

Clears resource cache memory and runs `clearCache` synchronization.

If you are using `AngularJsonAPISynchronizationLocal` it also clears locally stored data.

## Collection

Collection is a bucket of objects it is returned by `all` method of Resource. Each collection is bind to the request params (filter, include etc.).

### Properties

* **resource** - resource of the collection objects
* **type** - type of the collection objects
* **params** - params of the collection (filters, includes)
* **errors** - errors of the collection [(read more)](#errors)
* **data** - arrays of objects holded by collection
* **loading** - boolean marking if collection is loading
* **loadingCount** - number of different synchronizations that are loading the collection
* **pristine** - marks if collection hasn't been loaded from cache (it is being loaded for the first time)
* **synchronized** - marks if collection has be synchronized with the server during this session
* **updatedAt** - timestamp of last synchronization that updated the collection

### Refreshing collection

`collection.refresh()` or `collection.fetch()`

Fetches the collection data through `all` synchronization. Returns a promise that is resolved or rejected with the collection after the synchronization is finished.

### Getting object from collection

`collection.get(id, params)`

Same as [`resource.get(id, params)`](#getting-object).


### Handling collection errors

`collection.hasErrors()`

Returns true or false wether collection has errors or not, they can be handled as any other error. [Read more](#errors)

## Object

Object is a final wrapper for data returned by your API.

### Properties

* **new** - marks if the object is new (has just been initialized)
* **stable** - marks if the object is surely present on the server (at least one synchronization has been succesfuly resolved during this session)
* **synchronized** - marks if the object is synchrinized with server (at least one `get`, `add` or `update` synchronization has been succesfuly resolved during this session)
* **pristine** - marks if the resource has just been requested and is not present in the memory, nor localstore
* **removed** - marks if the object has been removed. Removed object are also (after succesful synchronization) cleared from collections, but you can use this just in case.
* **loading** - marks if the object has some loading synchronizations ongoing
* **saving** - marks if the object has some saving synchronizations ongoing
* **updatedAt** -timestamp of last synchronization that updated the object
* **loadingCount** - number of different synchronizations that are loading the object
* **savingCount** - number of different synchronizations that are saving the object
* **updatedAt** - timestamp of last synchronization that updated the object

### Object data

You can access data associated with the object with `object.data`.

* `object.data.id` -  Object id
* `object.data.type` -  Object type
* `object.data.attributes` -  Object attributes as a key-value object

**None of those value should be modified directly**. To modify an object you should use [`object.form`](#object-form).

#### Object form

Object form is similar to the object itself and it should be used to update its parent attributes and relationships.

#### Validating form

`object.form.validate(attributeKey)`

It validates form and returns promise that is either resolved or rejected, depending on the outcome of the validation. If `attributeKey` is not specified all attributes are validated.

You don't need to run `validate` before `save` as it is runned automaticly.

#### Saving object

`object.save()` or `object.form.save()`

Saves objects: validates the form, synchronizes new values with synchronizations and finally updates the actual object attributes.

#### Reseting object form

`object.reset()` or `object.form.reset()`

Resets form to the values of the object attributes.

### Object relationships

Getting an managing object relationships with ease was the primary motivation to create this package. each object has `object.relationships` proparty that is a key-value store of its relationships. Each relationship can be retrived by `object.relationships[key]` the return value depends on the relationship type:

* `hasOne`
    * `undefined` - if object relationships hasn't been fetched from the server yet
    * `null` - if relationship has no related object
    * `object` - if relationship is present
* `hasMany`
    * `undefined` - if object relationships hasn't been fetched from the server yet
    * `[object]` - if relationship is present

Any of the operations does not run `get` synchronization

#### Linking object relationship

There are two ways of linking object to other object: through form or directly.

##### Linking object relationship through form

`object.form.link(key, target)`

Object form relationship with `key` gets linked to the target. New relationship state is synchronized when you [`save` the object](#saving-object).

*Currenty this operation does not link the target form back, but it's on the [roadmap](#roadmap)*

##### Linking object relationship without a form

`object.link(key, target)`

Object relationship with `key` gets linked to the target. New relationship state is synchronized immidiately with `link` synchronization.

#### Unlinking object relationship through form

`object.form.unlink(key, target)`

Object form relationship with `key` gets unlinked from the target. New relationship state is synchronized when you [`save` the object](#saving-object).

*Currenty this operation does not unlink the target form back, but it's on the [roadmap](#roadmap)*

#### Unlinking object relationship without a form

`object.unlink(key, target)`

Object relationship with `key` gets unlinked from the target. New relationship state is synchronized immidiately with `unlink` synchronization.

### Refreshing object

`object.refresh(params)`

Refreshes object using [same params as get](#getting-object).

### Handling object errors

`object.hasErrors()`

Returns true or false wether object has errors or not, they can be handled as any other error. [Read more](#errors)

### Serializing object

`object.toJson()`

Serializes object to JSON according to JSON API schema.

<!--
### Deserializing object
-->

## Errors

Errors are stored in the errors property of an object or a collection. Each key of error property has error object connected with one type of activity (e.g. validation errors, synchronization errors etc.).

### Properties

Each error object has following properties:

* **name** - type of errors (e.g. 'synchronization)
* **description** - description (e.g. 'errors that occurs during synchronization')
* **errors** - object with `key: [error]`
    * `synchronization`: errors are indexed by synchronization
    * `validation`: errors are indexed by attribute

### Accessing errors

`errorsObject.errors`

Errors can be listed from `errors` property of errors object.

### Clearing error

`errorsObject.clear(key)`

Clears errors with given key, if `undefined` all errors are cleared.

### Adding error

`errorsObject.add(key, error)`

Adds error with given key.

#### Adding errors array

`errorsObject.add([{key: key, error: error}])`

Adds each error to `errorsObject.errors[key]`.

<!--
# Directives

## Promise-button
-->

# Roadmap

## 1.0.0-alpha.3
* [ ] Two-way object.form linking (easy)
* [ ] Updating object with values returned by update/add (easy)
* [ ] Add method to track get synchronization promise (easy-medium)
* [ ] Add objects for hasMany/hasOne relationship (medium)
* [ ] Protect object attributes from being edited explicitly (without form -> save) (medium)
* [ ] amplify.js for localstorage (easy)
* [ ] I18n support (easy-medium)
* [ ] Rename Synchronization to Source (easy)

## 1.0.0-beta.1
* [ ] unit tests (at least 50% coverage)
* [ ] `sexy` demo
* [ ] readonly attributes
* [ ] survey for missing features and/or usability improvements

## 1.0.0-beta.2
* [ ] unit tests (at least 70% coverage)
* [ ] features/improvements from the survey

## 1.0.0
* [ ] finall bug fixes and improvements
* [ ] even more unit tests
* [ ] performance / memory leaks tests

## > 1.0.0 (ideas)
* [ ] Better cache management
* [ ] PouchDB/LevelUp support
* [ ] Socket synchronization
* [ ] Offline synchronization support, revisions, conflicts management
