# Angular JsonAPI
[![Code Climate](https://codeclimate.com/github/jakubrohleder/angular-jsonapi/badges/gpa.svg)](https://codeclimate.com/github/jakubrohleder/angular-jsonapi)

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

## Table of Contents

* [x] [About this module](#about-this-module)
* [ ] [Demo](#demo)
* [x] [Installation](#installation)
* [ ] [Configuration](#configuration)
	* [ ] [Model](#model)
	* [ ] [Validation](#validation)
	* [ ] [Custom validators](#custom-validators)
* [ ] [API](#api)
	* [ ] [New object](#new-object) 
	* [ ] [Requests](#requests)
	* [ ] [Forms](#forms)
	* [ ] [Synchronizations](#synchronizations)
	* [ ] [Errors handling](#errors-handling)
* [ ] [Custom synchronizations](#custom-synchronizations)
* [ ] [Roadmap](#using-alternate-response-formats)

## About this module

The idea behind this module is to make those boring and generic data manipulations stuff easy. No more problems with complex data structure, synchronizing data with the server, caching objects or recreating relationships.

## Demo

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

## Installation

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

## Configuration

### Model

### Validations

### Custom validations

## API

### New object

### Requests

### Forms

### Synchronizations

### Errors handling

## Custom synchronizations



## Roadmap


