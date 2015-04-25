module.exports = function(config) {
  'use strict';
  var configuration = {
    basePath: '',
    frameworks: ['mocha', 'chai'],

    files: [
      'node_modules/chai/chai.js',
      'bower_components/angular-uuid4/angular-uuid4.js',
      'src/**/*.js'
    ],
    reporters: ['progress'],

    port: 9876,
    colors: true,
    autoWatch: false,
    singleRun: false,


    browsers : ['PhantomJS'],

    plugins : [
      'karma-phantomjs-launcher',
      'karma-mocha',
      'karma-chai'
    ],

  };

  config.set(configuration);
};
