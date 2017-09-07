const autoprefixer = require('gulp-autoprefixer');
const babelify = require('babelify');
const browserify = require('browserify');
const browserSync = require('browser-sync');
const cleancss = require('gulp-clean-css');
const eslint = require('gulp-eslint');
const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const pump = require('pump');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const stylelint = require('gulp-stylelint');
const uglify = require('gulp-uglify-es').default;
const vinylBuffer = require('vinyl-buffer');
const vinylSource = require('vinyl-source-stream');

const BASES = {
  app: 'src/',
  dist: 'dist/',
  images: 'dist/images/',
  root: './',
};

const PATH = {
  app: 'src/js/app.js',
  html: ['src/**/*.html'],
  images: ['src/images/*'],
  scripts: ['src/js/**/*.js', '!js/libs/**/*.js', '!node_modules/**'],
  styles: ['src/styles/**/*.scss', 'src/styles/**/*.sass', 'src/styles/**/*.css'],
};

// Github user pages requires index.html to be in master branch, root dir
gulp.task('html', () => {
  gulp.src(PATH.html)
    .pipe(gulp.dest(BASES.root));
});

// Process SCSS files and concatenate them into one output file
gulp.task('stylelint', (cb) => {
  pump([
    gulp.src(PATH.styles),
    stylelint({ reporters: [{ formatter: 'string', console: true }] }),
  ], cb);
});

// Process SCSS files and concatenate them into one output file
gulp.task('styles', ['stylelint'], (cb) => {
  pump([
    gulp.src(PATH.styles),
    sourcemaps.init(),
    sass().on('error', sass.logError),
    autoprefixer({ browsers: ['last 2 versions'] }),
    rename({ basename: 'style', suffix: '.min' }),
    cleancss(),
    sourcemaps.write('/'),
    gulp.dest(BASES.dist),
    browserSync.stream({ match: PATH.dist }),
  ], cb);
});

// Lint JS code with eslint
gulp.task('eslint', (cb) => {
  pump([
    gulp.src(PATH.scripts),
    eslint(),
    eslint.format(),
    eslint.failAfterError(),
  ], cb);
});

// Transpile JS code
gulp.task('scripts', ['eslint'], (cb) => {
  pump([
    browserify({ entries: PATH.app, debug: true })
      .transform(babelify, { presets: ['es2015'], sourceMaps: true })
      .bundle(),
    vinylSource('app.min.js'),
    vinylBuffer(),
    sourcemaps.init({ loadMaps: true }),
    uglify(),
    sourcemaps.write('/'),
    gulp.dest(BASES.dist),
    browserSync.stream({ match: PATH.dist }),
  ], cb);
});

// Minify images, output them in dist
gulp.task('imagemin', () => {
  gulp.src(PATH.images)
    .pipe(imagemin())
    .pipe(gulp.dest(BASES.images))
    .pipe(browserSync.stream({ match: BASES.dist }));
});

gulp.task('watch', () => {
  browserSync.create();
  browserSync.init({
    injectChanges: true,
    server: `${BASES.root}`,
  });

  gulp.watch(PATH.html, ['html']).on('change', browserSync.reload);
  gulp.watch(PATH.icon, ['exportIcon']);
  gulp.watch(PATH.images, ['imagemin']);
  gulp.watch(PATH.resume, ['exportResume']);
  gulp.watch(PATH.scripts, ['scripts']);
  gulp.watch(PATH.styles, ['styles']);
});

gulp.task('build', ['html', 'imagemin', 'styles', 'scripts']);
gulp.task('serve', ['build', 'watch']);
