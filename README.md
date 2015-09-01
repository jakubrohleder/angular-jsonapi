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
* [ ] [Configuration](#configuration)
 	* [x] [Schema](#schema)
	   * [x] [Validators schema](#validators-schema)
	   * [x] [Relationship schema](#relationship-schema)
	   * [x] [Include schema](#custom-functions-schema)
	   * [x] [Custom functions schema](#custom-functions-schema)
	* [ ] [Synchronizations](#synchronizations)
	   * [ ] [Own synchronizations](#own-synchronizations)
	* [ ] [Synchronizators](#synchronizators)
	   * [ ] [Own synchronizators](#own-synchronizators)
	* [ ] [Model](#model)
* [ ] [API](#api)
	* [ ] [New object](#new-object) 
	* [ ] [Requests](#requests)
	* [ ] [Forms](#forms)
	* [ ] [Synchronizations API](#synchronizations-api)
	* [ ] [Errors handling](#errors-handling)
* [ ] [Custom synchronizations](#custom-synchronizations)
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

Although `$jsonapiProvider` is injected during app configuration phase currently it does not have any confiuration options. All the configuration shoud be made in the `run` phase using `$jsonapi`.

## Schema

The only complex step of using this module, is to provide data schema, that is used later on to create objects, validate forms etc. Each data type should have it's own schema. The schema is an object containing following properties:

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
|`{maxlength: value}` and `{minlenght: value}` | Checks if the field content is shorter/longer or equal to `value`. |
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

Custom functions are extremly helpfull if you need to inject some common functions that object should perform into its prototype.

## Synchronizations

### Own synchronizations

## Synchronizators

### Own synchronizators

## Model

# API

## New object

## Requests

## Forms

## Synchronizations API

## Errors handling

# Custom synchronizations

# Roadmap


