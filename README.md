# Angular JsonAPI

[![Code Climate](https://codeclimate.com/github/jakubrohleder/angular-jsonapi/badges/gpa.svg)](https://codeclimate.com/github/jakubrohleder/angular-jsonapi)

## Use with caution it's only 1.0.0-alpha.7

*This module is still in a WIP state, many things work fine but it lacks tests and API may change, also documentation can not reflect the real state*

*To see all of the features in action run and study the demo.*

Simple and lightweight, yet powerful ORM for your frontend that seamlessly integrates with your JsonAPI server.

# [Live demo](http://jakubrohleder.github.io/angular-jsonapi)

This module provides the following features:

* Converting JsonApi responses into data objects
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
  - [Sources](#sources)
  - [Encoding params](#encoding-params)
  - [Decoding params](#decoding-params)
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
  - [1.0.0-alpha.3 (done)](#100-alpha3-done)
  - [1.0.0-alpha.4 (done)](#100-alpha4-done)
  - [1.0.0-alpha.5 (done)](#100-alpha5-done)
  - [1.0.0-alpha.6 (done)](#100-alpha6-done)
  - [1.0.0-alpha.7 (done)](#100-alpha7-done)
  - [1.0.0-alpha.*](#100-alpha)
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

* Include `angular-jsonapi` and sources modules (available: `angular-jsonapi-rest`, `angular-jsonapi-local`, `angular-jsonapi-parse`) in your module's dependencies:

~~~javascript
// in your js app's module definition
angular.module('myApp', [
  'angular-jsonapi',
  'angular-jsonapi-rest',
  'angular-jsonapi-local',
  'angular-jsonapi-parse'
]);
~~~

# Configuration

Although `$jsonapiProvider` is injected during app configuration phase currently it does not have any configuration options. All the configuration should be made in the `run` phase using `$jsonapi`. The only option as the moment is `$jsonapi.addResource`, it takes two arguments: [schema](#schema) and [synchronizer](#synchronizers).

## Schema

First step is to provide data schema, that is used later on to create objects, validate forms etc. Each data type should have it's own schema. The schema is an object containing following properties:

| field | description |
|---|---|
| **type** | Type of an object must be the same as the one in the JSON API response. Should be in plural. |
| **id** | Type of id field, supported types are: `'uuid4'`, `'int'`, `'string'` and custom, any other type defaults to `'string'`. Custom id type should be an object with two methods: `validate(id)` and `generate()`. If ids cannot be generated in the front you can omit `generate()`. |
| **attributes** | Object with the model attributes names as keys and [validation constraints](#validators) as values. |
| **relationships** | Object with the model relationships names as keys and [relationship schema](#relationship-schema) as values. |
| **include** | Object with extra values that should be included in the `get` or `all` request. |
| **functions** | Object with functions names as keys and [custom functions](#custom-functions) as values. |

For example schema for a Novel model can look like this:

~~~javascript
var novelsSchema = {
  type: 'novels',
  id: 'uuid4',
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
      reflection: 'appearances'
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

If you need more complex validation method, you can use your own function as a validator. As whole validator module it utilizes `validate.js` library.

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

Each relationship is described by separate schema with following properties:

| property | default value | description |
|---|---|---|
| `type ` | **required**  | Type of the relationship, either `hasMany` or `hasOne`. |
| `model` | pluralized relationship name  | Type of the model that this relationship can be linked to, not checked if `polymorphic` is set `true`. |
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

Custom functions schema is nothing more than just a simple object with function names as keys and functions as a value. All of the functions will be ran with an object instance bound to `this` and no arguments.

Custom functions are extremely helpful if you need to inject some methods common for the object type into its prototype.

## Synchronizers

Synchronizers are object that keep sources work together by running hooks in the right order, as well as creating the final data that is used to update object.

In most cases `$jsonapi.synchronizerSimple` is enough. But if for example, you synchronize data with two REST sources at the same time and have to figure out which of the responses is up-to-date, you should write your own synchronizer.

`$jsonapi.synchronizerSimple` constructor takes one argument - array of [sources] (#sources).

~~~javascript
    var novelsSynchronizer = $jsonapi.synchronizerSimple.create([
      localeSource, restSource
    ]);
~~~

### Custom Synchronizer

todo

## Sources

Sources places to store and fetch data. At the moment two sources types are supported:

### SourceLocal

Saves data in the local store and loads them each time you visit the site, in this way your users can access data immediately even if they are offline. All the data are cleared when the users logs out.

Date is saved each time it changes and loaded during initialization of the module.

To use this source you must include `angular-jsonapi-local` in your module dependencies.

Source constructor takes one argument - prefix for local store objects, default value is `AngularJsonAPI`.

~~~javascript
var localSynchro = $jsonapi.sourceLocal.create('Local synchro', 'AngularJsonAPI');

~~~

**Keep in mind that the localStorage size is limited to approx. 5MB on most devices. Exceeding this limit can cause unpredicted results.**

### SourceRest

Is a simple source with the RESTAPI supporting JSON API format. It performs following operations:
`remove`, `unlink`, `link`, `update`, `add`, `all`, `get`. Every time the data changes the suitable request is made to keep your data synchronized.

To use this source you must include `angular-jsonapi-rest` in your module dependencies.

Source constructor takes 2 arguments: `name` and `url` of the resource, there is no default value.

~~~javascript
var restSynchro = $jsonapi.sourceRest.create('Rest synchro', 'localhost:3000/novels');

~~~

## Encoding params

`$jsonapi.sourceRest.encodeParams(params)`

Encodes params object into `jsonapi` url params schema. Returned object can be then sent as `params` attribute of `$http` request configuration object.

## Decoding params

`$jsonapi.sourceRest.decodeParams(params)`

Decodes params from `jsonapi` url schema (e.g. obtained by `$location.search()).

### SourceParse

**alpha stage, not all options are supported**

If you like the way object are managed by this package, but still you want to use awesome Parse.com API possibilities I got something for you!

SourceParse maps [parse.com](https://parse.com) js sdk to angular-jsonapi schema. It performs following operations:
`remove`, `update`, `add`, `all`, `get`. Every time the data changes the suitable request is made to keep your data synchronized.

`unlink`, `link` operations for hasOne relationship can be made by setting appropriate key to the linked object Id. HasMany relationships are not supported yet.

To use this source you must include `angular-jsonapi-parse` in your module dependencies.

Source constructor takes 2 arguments: `name`, `table` there is no default value. `table` is a name of the mapped object table in [parse.com](https://parse.com) API (usually starts with the capital letter and is singular)

**If you do not use [parse.com](https://parse.com) sdk in other project parts, you have to initialize the source first by calling `parseSynchro.initialize(appId, jsKey)`**

~~~javascript
var parseSynchro = $jsonapi.sourceParse.create('Parse synchro', 'Novel');

//Only if you do not call Parse.initialize somewhere else
parseSource.initialize('JZjOE9MApKqihwZhtOuxs6YkGpXLshUiat63fiCq', '96GQW1YD1J1nG7jesEkA9e9y2ngguzhiXJXYoO2E');

~~~

### Custom Sources

todo

## Wrap up

After performing `$jsonapi.addResource(schema, synchronizer);` the resource is accessible by `$jsonapi.getResource(type);`. The easiest way to use it is to create `angular.factory` for each model and then inject it to your controllers.

All in all configuration of the factory for novels can look like this:

~~~javascript
(function() {
  'use strict';

  angular.module('angularJsonapiExample')

  .run(function(
    $jsonapi
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

    var localeSource = $jsonapi.sourceLocal.create('LocalStore source', 'AngularJsonAPI');
    var restSource = $jsonapi.sourceRest.create('Rest source', '/novels');
    var novelsSynchronizer = $jsonapi.synchronizerSimple.create([localeSource, restSource]);

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

`$jsonapi` as the main factory of the package has few methods that will help you with creating and managing resources.

### Adding resource

`$jsonapi.addResource(schema, synchronizer)`

You can read about the method at [configuration section](#configuration).

### Getting resource

`$jsonapi.getResource(type)`

Returns a resource with the given `type`. If no resource with `type` has been added before returns `undefined`.

### All resources

`$jsonapi.allResources()`

Returns object with all resources indexed by `type`.

### Listing resources

`$jsonapi.listResources()`

Returns array with all resources `types`.

### Clearing cache

`$jsonapi.listResources()`

Runs `clearCache` for each resource. [Read more](#resource-clear-cache)

### Adding validator

`$jsonapi.addValidator(name, validator)`

Adds validator to validates object schema. [Read more](#custom-validators)

## Resource

After configuration phase resources are the main object your application will operate with. They represent one class of objects (e.g. Users or Comments). They are capable of most operation that you expect REST API to perform.

### Properties

Each resource let you access following attributes:

* **initialized** - states the resource has been already initialized. Usable if `init` synchronization of resource is asynchronous. Read more (todo)
* **type** - type of the resource
* **schema** - resource schema

This attributes shouldn't be modified.

### Getting object

`resource.get(id, params)`

Objects can be accessed by resource using `resource.get(id, params)`. It returns an [**object**](#object) with given id stored in the memory, at the same time `get` synchronization is triggered so the object data is synchronized with the server. The promise associated with synchronization can accessed by `result.promise`, it is resolved with request meta information.

#### Params

Params may be be an object that can contain keys:

* **include** - string with comma delimited relationships that will override schema settings.

Include key supported explicitly, but other keys will also be passed to the synchronization.

**If params are omitted `undefined` default params (taken from schema) are used.**

### All objects

`resource.all(params)`

All object can be accessed by resource using `resource.all(params)`. It returns a [**collection**](#collection) with all objects of resource type stored in the memory, at the same time `all` synchronization is triggered so the objects data are synchronized with the server. The promise associated with synchronization can accessed by `result.promise`, it is resolved with request meta information.

#### Params

Params must be an object that can contain keys:

* **include** - string with comma delimited relationships that will override schema settings.
* **filter** - object with `attribute: value` values. Filters are used as 'exact match' (only objects with `attribute` value same as `value` are returned). `value` can also be an array, then only objects with same `attribute` value as one of `values` array elements are returned.
* **limit** - sets quota limit for [parse.com source](#SourceParse).

Those two keys are supported explicitly, but other keys will also be passed to the synchronization.

**If params are omitted `undefined` default params (taken from schema) are used.**

### Removing object

`resource.remove(id)`

Removes object with given `id`, promise associated with synchronization is returned, it is resolved with request meta information.

### Initializing new object

`resource.initialize()`

Initializes a new [**object**](#object). It can be filled up by editing its [form](#object-form) and synchronized later on.

### Clearing cache[resource-clear-cache]

`resource.clearCache()`

Clears resource cache memory and runs `clearCache` synchronization.

If you are using `AngularJsonAPISourceLocal` it also clears locally stored data.

## Collection

Collection is a bucket of objects it is returned by `all` method of Resource. Each collection is bind to the request params (filter, include etc.). All of the asynchronous object method are resolved with synchronization meta data.

### Properties

* **resource** - resource of the collection objects
* **type** - type of the collection objects
* **params** - params of the collection (filters, includes)
* **errors** - errors of the collection [(read more)](#errors)
* **data** - arrays of objects held by a collection
* **loading** - boolean marking if collection is loading
* **loadingCount** - number of different synchronizations that are loading the collection
* **pristine** - marks if collection hasn't been loaded from cache (it is being loaded for the first time)
* **synchronized** - marks if collection has be synchronized with the server during this session
* **updatedAt** - timestamp of last synchronization that updated the collection
* **promise** - promise that is set when the collection is fetched for the first time (by `resource.all(params)`) and resolved or rejected with collection object.

### Refreshing collection

`collection.refresh()` or `collection.fetch()`

Fetches the collection data through `all` synchronization. Returns a promise that is resolved with request meta data or rejected after the synchronization is finished.

### Getting object from collection

`collection.get(id, params)`

Same as [`resource.get(id, params)`](#getting-object).


### Handling collection errors

`collection.hasErrors()`

Returns true or false whether collection has errors or not, they can be handled as any other error. [Read more](#errors)

## Object

Object is a final wrapper for data returned by your API. All of the asynchronous object method are resolved with synchronization meta data.

### Properties

* **new** - marks if the object is new (has just been initialized)
* **stable** - marks if the object is surely present on the server (at least one synchronization has been successfully resolved during this session)
* **synchronized** - marks if the object is synchronized with server (at least one `get`, `add` or `update` synchronization has been successfully resolved during this session)
* **pristine** - marks if the resource has just been requested and is not present in the memory, nor localstore
* **removed** - marks if the object has been removed. Removed object are also (after successful synchronization) cleared from collections, but you can use this just in case.
* **loading** - marks if the object has some loading synchronizations ongoing
* **saving** - marks if the object has some saving synchronizations ongoing
* **updatedAt** -timestamp of last synchronization that updated the object
* **loadingCount** - number of different synchronizations that are loading the object
* **savingCount** - number of different synchronizations that are saving the object
* **updatedAt** - timestamp of last synchronization that updated the object
* **promise** - promise that is set when the object is fetched for the first time (by `resource.get(id, params)`) and resolved with request meta.

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

You don't need to run `validate` before `save` as it is automatically ran.

#### Saving object

`object.save()` or `object.form.save()`

Saves objects: validates the form, synchronizes new values with synchronizations and finally updates the actual object attributes.

#### Resetting object form

`object.reset()` or `object.form.reset()`

Resets form to the values of the object attributes.

### Object relationships

Getting an managing object relationships with ease was the primary motivation to create this package. each object has `object.relationships` property that is a key-value store of its relationships. Each relationship can be retrieved by `object.relationships[key]` the return value depends on the relationship type:

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

`object.form.link(key, target, oneWay = false)`

Object form relationship with `key` gets linked to the `target.form`. New relationship state is synchronized when you [`save` the object](#saving-object).

If you do not want to make relationship affect the target form you can set oneWay to `true`.

##### Linking object relationship without a form

`object.link(key, target)`

Object relationship with `key` gets linked to the target. New relationship state is synchronized immediately with `link` synchronization.

#### Unlinking object relationship through form

`object.form.unlink(key, target, oneWay = false)`

Object form relationship with `key` gets unlinked from the target. New relationship state is synchronized when you [`save` the object](#saving-object).

If you do not want to make unlinked relationship affect the target form you can set oneWay to `true`.

#### Unlinking object relationship without a form

`object.unlink(key, target)`

Object relationship with `key` gets unlinked from the target. New relationship state is synchronized immediately with `unlink` synchronization.

### Refreshing object

`object.refresh(params)`

Refreshes object using [same params as get](#getting-object).

### Handling object errors

`object.hasErrors()`

Returns true or false whether object has errors or not, they can be handled as any other error. [Read more](#errors)

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

## 1.0.0-alpha.3 (done)
* [x] Two-way object.form linking (easy)
* [x] Updating object with values returned by update/add (easy)
* [x] Add method to track get/all synchronization promise (easy-medium)
* [x] Multiple types of ids
* [x] Rename Synchronization to Source (easy)

## 1.0.0-alpha.4 (done)
* [x] Fix bugs introduced by previous version

## 1.0.0-alpha.5 (done)
* [x] Filters
* [x] Localstore space occupation data
* [x] Adding services to $jsonapi (e.g. `$jsonapi.synchronizerSimple`)

## 1.0.0-alpha.6 (done)
* [x] Fix bugs introduced by previous version

## 1.0.0-alpha.7 (done)
* [x] fix for one side relationships
* [x] fix for collection.pristine
* [x] Parse.com source alpha

## 1.0.0-alpha.*
* [ ] Parse.com source full support
* [ ] I18n support (medium)
* [ ] File source
* [ ] Add objects for hasMany/hasOne relationship (medium)
* [ ] Protect object attributes from being edited explicitly (without form -> save) (medium)
* [ ] readonly attributes (can't be changed)
* [ ] Api versioning!
* [ ] Pagination

## 1.0.0-beta.1
* [ ] unit tests (at least 50% coverage)
* [ ] `sexy` demo

## 1.0.0-beta.2
* [ ] unit tests (at least 70% coverage)
* [ ] features/improvements from the survey

## 1.0.0
* [ ] final bug fixes and improvements
* [ ] even more unit tests
* [ ] performance / memory leaks tests

## > 1.0.0 (ideas)
* [ ] Better cache management
* [ ] PouchDB/LevelUp support
* [ ] Socket synchronization
* [ ] Offline synchronization support, revisions, conflicts management
