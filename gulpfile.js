const babelify = require('babelify');
const browserify = require('browserify');
const browserSync = require('browser-sync');
const gulp = require('gulp');
const loadPlugins = require('gulp-load-plugins');
const pump = require('pump');
const vinylBuffer = require('vinyl-buffer');
const vinylSource = require('vinyl-source-stream');

const $ = loadPlugins();
const CONFIG = {
  bases: {
    app: 'src/',
    dist: 'dist/',
    images: 'dist/images/',
    root: './',
  },
  path: {
    app: 'src/js/app.js',
    html: ['src/**/*.html'],
    images: ['src/images/*'],
    scripts: ['src/js/**/*.js', '!js/libs/**/*.js', '!node_modules/**'],
    styles: ['src/styles/**/*.scss', 'src/styles/**/*.sass'],
  },
  sourcemap: !$.util.env.production,
};

// Github user pages requires index.html to be in master branch, root dir
gulp.task('html', () => {
  gulp.src(CONFIG.path.html)
    .pipe(gulp.dest(CONFIG.bases.root));
});

// Process SCSS files and concatenate them into one output file
gulp.task('stylelint', (cb) => {
  pump([
    gulp.src(CONFIG.path.styles),
    $.stylelint({ reporters: [{ formatter: 'string', console: true }] }),
  ], cb);
});

// Process SCSS files and concatenate them into one output file
gulp.task('styles', ['stylelint'], (cb) => {
  pump([
    gulp.src(CONFIG.path.styles),
    CONFIG.sourcemap, $.sourcemaps.init(),
    $.sass().on('error', $.sass.logError),
    $.autoprefixer({ browsers: ['last 2 versions'] }),
    $.rename({ basename: 'style', suffix: '.min' }),
    $.cleanCss(),
    CONFIG.sourcemap, $.sourcemaps.write('/'),
    gulp.dest(CONFIG.bases.dist),
    browserSync.stream({ match: CONFIG.path.dist }),
  ], cb);
});

// Lint JS code with eslint
gulp.task('eslint', (cb) => {
  pump([
    gulp.src(CONFIG.path.scripts),
    $.eslint(),
    $.eslint.format(),
    $.eslint.failAfterError(),
  ], cb);
});

// Transpile JS code
gulp.task('scripts', ['eslint'], (cb) => {
  pump([
    browserify({ entries: CONFIG.path.app, debug: true })
      .transform(babelify, { presets: ['es2015'], sourceMaps: true })
      .bundle(),
    vinylSource('app.min.js'),
    vinylBuffer(),
    CONFIG.sourcemap, $.sourcemaps.init({ loadMaps: true }),
    $.babelMinify(),
    CONFIG.sourcemap, $.sourcemaps.write('/'),
    gulp.dest(CONFIG.bases.dist),
    browserSync.stream({ match: CONFIG.path.dist }),
  ], cb);
});

// Minify images, output them in dist
gulp.task('imagemin', () => {
  gulp.src(CONFIG.path.images)
    .pipe($.imagemin())
    .pipe(gulp.dest(CONFIG.bases.images))
    .pipe(browserSync.stream({ match: CONFIG.bases.dist }));
});

gulp.task('watch', () => {
  browserSync.create();
  browserSync.init({
    injectChanges: true,
    server: `${CONFIG.bases.root}`,
  });

  gulp.watch(CONFIG.path.html, ['html']).on('change', browserSync.reload);
  gulp.watch(CONFIG.path.icon, ['exportIcon']);
  gulp.watch(CONFIG.path.images, ['imagemin']);
  gulp.watch(CONFIG.path.resume, ['exportResume']);
  gulp.watch(CONFIG.path.scripts, ['scripts']);
  gulp.watch(CONFIG.path.styles, ['styles']);
});

gulp.task('build', ['html', 'imagemin', 'styles', 'scripts']);
gulp.task('serve', ['build', 'watch']);
