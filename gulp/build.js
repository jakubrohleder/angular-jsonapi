'use strict';

var gulp = require('gulp');

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del']
});

module.exports = function(options) {
  gulp.task('build', function() {
    return gulp.src(options.lib + '/**/*.js')
      .pipe($.sourcemaps.init())
      .pipe($.ngAnnotate())
      .pipe($.angularFilesort())
      .pipe($.concat('angular-jsonapi.js'))
      .pipe($.sourcemaps.write('./'))
      .pipe(gulp.dest(options.dist + '/'))
      .pipe($.filter('angular-jsonapi.js'))
      .pipe($.rename('angular-jsonapi.min.js'))
      .pipe($.uglify({ preserveComments: $.uglifySaveLicense })).on('error', options.errorHandler('Uglify'))
      .pipe($.sourcemaps.write('./'))
      .pipe(gulp.dest(options.dist + '/'))
      .pipe($.size({ title: options.dist + '/', showFiles: true }));
  });
};
