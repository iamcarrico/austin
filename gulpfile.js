'use strict';

// Load up gulp.
var gulp = require('gulp');
// Load in all standard plugins.
var $ = require('gulp-load-plugins')();
// load the rest of our plugins that dont start with 'gulp-'.
var browserSync = require('browser-sync');
var cp = require('child_process');
var runSequence = require('run-sequence').use(gulp);
var stylish = require('jshint-stylish');


var Eyeglass = require("eyeglass").Eyeglass;
var sassOptions = {};
var eyeglass = new Eyeglass(sassOptions);

// Some settings vars we will put at the top, so we don't have to sift through
// all of this to change directory names.
var settings = {
  "outputDir": "_site",
  "sassDir": "_sass",
  "cssDir": "css",
  "jsDir": "js"
};

gulp.task('default', $.taskListing);

/**
 * Gulp task that compiles our Sass.
 */
gulp.task('sass', function() {
  gulp.src(settings.sassDir + '/**/*.scss')
    .pipe($.sass(eyeglass.sassOptions()).on("error", $.sass.logError))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(gulp.dest(settings.cssDir))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('css', ['sass']);

/**
 * Lint all of the files that can be linted.
 * @name lint
 */
gulp.task('lint', ['lint-js', 'lint-sass']);

/**
 * Run linting on all of the JavaScript files
 * @name lint-js
 */
gulp.task('lint-js', function () {
  return gulp.src(settings.jsDir + '/**/*.js')
    .pipe($.jshint())
    .pipe($.jscs())
    .on('error', function() {
      browserSync.notify('<span style="color: red">ERROR:</span> JavsScript did not lint.');
    })
    .pipe($.jscsStylish.combineWithHintResults())
    .pipe($.jshint.reporter('jshint-stylish'));
});

/**
 * Run linting on all of the Sass files/
 * @name lint-sass
 */
gulp.task('lint-sass', function() {

  return gulp.src(settings.sassDir + '/**/*.scss')
    .pipe($.scssLint({
//      bundleExec: true, // Turned this off, as it will not work with Jekyll right now.
      config: 'lint.yml'
  }));
});

/**
 * Gulp task that runs browserSync.
 */
gulp.task('browserSync', function () {
  browserSync({
    server: {
      baseDir: settings.outputDir
    }
  });
});

/**
 * Gulp task that runs a jekyll server.
 *
 * @see sass gulp task.
 */
gulp.task('server', function (cb) {
  return runSequence(['sass'],
    'jekyll-dev',
    ['browserSync', 'watch'],
    cb
  );
});

gulp.task('serve', ['server']);

/**
 * Gulp task that runs bundle exec, and jekyll build.
 */
gulp.task('jekyll-build', function (cb) {
  return cp.spawn('bundle', ['exec', 'jekyll', 'build'], {stdio: 'inherit'})
    .on('close', cb);
});

/**
 * Alias for 'jekyll-build' gulp task.
 */
gulp.task('jekyll', ['jekyll-build']);

/**
 * Gulp task that runs bundle exec, and jekyll build for a dev server.
 */
gulp.task('jekyll-dev', function (cb) {
  browserSync.notify('<span style="color: grey">Running:</span> $ jekyll build');
  return cp.spawn('bundle', ['exec', 'jekyll', 'build', '--config=_config.yml,_config.dev.yml'], {stdio: 'inherit'})
    .on('close', cb);
});

/**
 * Gulp task that rebuilds a jekyll server.
 */
gulp.task('jekyll-rebuild', function () {
  return runSequence(['jekyll-dev'], function () {
      browserSync.reload();
  });
});

/**
 * Run any tests that we want on this site.
 */
gulp.task('test', ['lint']);

/**
 * Gulp task that listenes to file change events,
 * and runs other tasks accordingly.
 *
 * @see sass gulp task.
 * @see jekyll-rebuild gulp task.
 */
gulp.task('watch', function () {
  gulp.watch(settings.sassDir + '/**/*.scss', ['sass', 'jekyll-rebuild']);
  gulp.watch([
    "**/*.html",
    "**/*.md",
    "!_site/**/*.html",
    "!node_modules/**/*"
  ], ['jekyll-rebuild']);
});

/**
 * Gulp task to build the site, and have a full site in the _site folder.
 */
gulp.task('build', function (cb) {
  return runSequence(
    'test',
    'sass',
    'jekyll',
    cb
  );
});


/**
 * Gulp task to deploy. This will deploy it. REALLY. Like... deploy deploy.
 *
 * @see build gulp task
 * @see commit gulp task
 */
gulp.task('deploy', function (cb) {
  return runSequence(
    'build',
    'commit',
    cb
  );
});

/**
 * Gulp task to commit the site folder to the gh-pages branch and push.
 */
gulp.task('commit', function () {
  gulp.src("./_site/**/*")
    .pipe($.ghPages({
      cacheDir: '.tmp',
      branch: 'gh-pages'
    })).pipe(gulp.dest('/tmp/austin.live'));
});
