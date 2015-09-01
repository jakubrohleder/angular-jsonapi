'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');

var $ = require('gulp-load-plugins')();

gulp.task('build', function() {
  return gulp.src([
    path.join(conf.paths.lib, '/**/*.js'),
    path.join('!' + conf.paths.lib, '/**/*.spec.js'),
    path.join('!' + conf.paths.lib, '/**/*.mock.js')
  ])
  .pipe($.sourcemaps.init())
  .pipe($.ngAnnotate())
  .pipe($.angularFilesort())
  .pipe($.concat('angular-jsonapi.js'))
  .pipe($.sourcemaps.write('./'))
  .pipe(gulp.dest(conf.paths.dist + '/'))
  .pipe($.filter('angular-jsonapi.js'))
  .pipe($.rename('angular-jsonapi.min.js'))

  .pipe($.uglify({ preserveComments: $.uglifySaveLicense })).on('error', conf.errorHandler('Uglify'))
  .pipe($.sourcemaps.write('./'))
  .pipe(gulp.dest(conf.paths.dist + '/'))
  .pipe($.size({ title: conf.paths.dist + '/', showFiles: true }));
});
