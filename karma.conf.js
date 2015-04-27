module.exports = function(config) {
  'use strict';
  var configuration = {
    basePath: '',
    frameworks: ['mocha', 'chai-as-promised', 'chai'],

    reporters: ['progress'],

    port: 9876,
    colors: true,
    autoWatch: false,
    singleRun: false,

    // logLevel: config.LOG_DEBUG,

    browsers: ['PhantomJS'],

    plugins: [
      'karma-phantomjs-launcher',
      'karma-chrome-launcher',
      'karma-mocha',
      'karma-chai-as-promised',
      'karma-chai'
    ]

  };

  config.set(configuration);
};
