'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del', 'merge-stream']
});
function build(skipParse){
  var srcs = [
    path.join(conf.paths.lib, '/**/*.js'),
    path.join('!' + conf.paths.lib, '/**/*.spec.js'),
    path.join('!' + conf.paths.lib, '/**/*.mock.js')
  ], parseFileName = skipParse ? '-without-parse' : '';
  if(skipParse){
      srcs.push(path.join('!' + conf.paths.lib, '/sources/parse/*'))
  }

  return gulp.src(srcs)
  .pipe($.sourcemaps.init())
  .pipe($.ngAnnotate())
  .pipe($.angularFilesort())
  .pipe($.concat('angular-jsonapi' + parseFileName + '.js'))
  .pipe($.sourcemaps.write('./'))
  .pipe(gulp.dest(conf.paths.dist.lib + '/'))
  .pipe($.filter('angular-jsonapi' + parseFileName + '.js'))
  .pipe($.rename('angular-jsonapi' + parseFileName + '.min.js'))

  .pipe($.uglify({ preserveComments: $.uglifySaveLicense })).on('error', conf.errorHandler('Uglify'))
  .pipe($.sourcemaps.write('./'))
  .pipe(gulp.dest(conf.paths.dist.lib + '/'))
  .pipe($.size({ title: conf.paths.dist.lib + '/', showFiles: true }));
}

gulp.task('build:lib', function(){
  console.log($, $.mergeStream);
  return $.mergeStream(build(true), build(false))
});

gulp.task('partials', function() {
  return gulp.src([
    path.join(conf.paths.src, '/app/**/*.html'),
    path.join(conf.paths.tmp, '/serve/app/**/*.html')
  ])
    .pipe($.minifyHtml({
      empty: true,
      spare: true,
      quotes: true
    }))
    .pipe($.angularTemplatecache('templateCacheHtml.js', {
      module: 'angularJsonapiExample',
      root: 'app'
    }))
    .pipe(gulp.dest(conf.paths.tmp + '/partials/'));
});

gulp.task('html', ['inject', 'partials'], function() {
  var partialsInjectFile = gulp.src(path.join(conf.paths.tmp, '/partials/templateCacheHtml.js'), { read: false });
  var partialsInjectOptions = {
    starttag: '<!-- inject:partials -->',
    ignorePath: path.join(conf.paths.tmp, '/partials'),
    addRootSlash: false
  };

  var htmlFilter = $.filter('*.html', { restore: true });
  var jsFilter = $.filter('**/*.js', { restore: true });
  var cssFilter = $.filter('**/*.css', { restore: true });
  var assets;

  return gulp.src(path.join(conf.paths.tmp, '/serve/*.html'))
    .pipe($.inject(partialsInjectFile, partialsInjectOptions))
    .pipe(assets = $.useref.assets())
    .pipe($.rev())
    .pipe(jsFilter)
    .pipe($.replace('localhost:3000', 'jsonapi-robot-wars.herokuapp.com'))
    .pipe($.sourcemaps.init())
    .pipe($.ngAnnotate())
    .pipe($.uglify({ preserveComments: $.uglifySaveLicense })).on('error', conf.errorHandler('Uglify'))
    .pipe($.sourcemaps.write('maps'))
    .pipe(jsFilter.restore)
    .pipe(cssFilter)
    .pipe($.replace('themes/default/assets/', '../'))
    .pipe($.sourcemaps.init())
    .pipe($.minifyCss({ processImport: false }))
    .pipe($.sourcemaps.write('maps'))
    .pipe(cssFilter.restore)
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.revReplace())
    .pipe(htmlFilter)
    .pipe($.minifyHtml({
      empty: true,
      spare: true,
      quotes: true,
      conditionals: true
    }))
    .pipe(htmlFilter.restore)
    .pipe(gulp.dest(path.join(conf.paths.dist.demo, '/')))
    .pipe($.size({ title: path.join(conf.paths.dist.demo, '/'), showFiles: true }));
});

gulp.task('fonts', function() {
  return gulp.src($.mainBowerFiles({includeDev: 'inclusive', overrides: conf.overrides}))
    .pipe($.filter('**/*.{eot,svg,ttf,woff,woff2}'))

    .pipe($.flatten())
    .pipe(gulp.dest(path.join(conf.paths.dist.demo, '/fonts/')));
});

gulp.task('other', function() {
  var fileFilter = $.filter(function(file) {
    return file.stat.isFile();
  });

  return gulp.src([
    path.join(conf.paths.src, '/**/*'),
    path.join('!' + conf.paths.src, '/**/*.{html,css,js,scss}')
  ])
    .pipe(fileFilter)
    .pipe(gulp.dest(path.join(conf.paths.dist.demo, '/')));
});

gulp.task('clean', function() {
  return $.del([
    path.join(conf.paths.dist.demo, '/'),
    path.join(conf.paths.tmp, '/'),
    path.join(conf.paths.dist.lib, '/')
  ]);
});

gulp.task('build:demo', ['html', 'fonts', 'other']);
