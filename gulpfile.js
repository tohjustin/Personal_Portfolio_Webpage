const browserSync = require('browser-sync');
const gulp = require('gulp');
const rename = require('gulp-rename');

// CSS
const autoprefixer = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');
const minifycss = require('gulp-clean-css');
const sass = require('gulp-sass');
const stylelint = require('gulp-stylelint');

// JAVASCRIPT
const babelify = require('babelify');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const eslint = require('gulp-eslint');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');

// SKETCH FILES
const shell = require('gulp-shell');

const BASES = {
  app: 'src/',
  dist: 'dist/',
  images: 'dist/images/',
  root: './',
};

const PATH = {
  app: 'src/js/app.js',
  exportResume: 'sketch/exportResume.sh',
  html: ['src/**/*.html'],
  images: ['src/images/*'],
  resume: ['sketch/resume.sketch'],
  scripts: ['src/js/**/*.js', '!js/libs/**/*.js', '!node_modules/**'],
  styles: ['src/styles/**/*.scss', 'src/styles/**/*.sass', 'src/styles/**/*.css'],
};

// Github user pages requires index.html to be in master branch, root dir
gulp.task('html', () => {
  gulp.src(PATH.html)
    .pipe(gulp.dest(BASES.root))
    .pipe(browserSync.stream({ match: BASES.root }));
});

// Process SCSS files and concatenate them into one output file
gulp.task('stylelint', () => {
  gulp.src(PATH.styles)
    .pipe(stylelint({ reporters: [{ formatter: 'string', console: true }] }));
});

// Process SCSS files and concatenate them into one output file
gulp.task('styles', () => {
  gulp.src(PATH.styles)
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
    .pipe(autoprefixer({ browsers: ['last 2 versions'] }))
    .pipe(rename({ basename: 'style', suffix: '.min' }))
    .pipe(minifycss())
    .pipe(sourcemaps.write('/maps'))
    .pipe(gulp.dest(BASES.dist))
    .pipe(browserSync.stream({ match: PATH.dist }));
});

// Lint JS code with eslint
gulp.task('eslint', () => {
  gulp.src(PATH.scripts)
    .pipe(eslint())
    .pipe(eslint.format());
});

// Transpile JS code
gulp.task('scripts', () => {
  browserify({ entries: PATH.app, debug: true })
    .transform(babelify, { presets: ['es2015'], sourceMaps: true })
    .bundle()
    .pipe(source('app.min.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(uglify())
    .pipe(sourcemaps.write('/maps'))
    .pipe(gulp.dest(BASES.dist));
});

// Minify images, output them in dist
gulp.task('imagemin', () => {
  gulp.src(PATH.images)
    .pipe(imagemin())
    .pipe(gulp.dest(BASES.images))
    .pipe(browserSync.stream({ match: BASES.dist }));
});

// Run bash script to generate resume .pdf & .png files
gulp.task('exportResume', () => {
  gulp.src(PATH.resume)
    .pipe(shell([`${PATH.exportResume} <%= file.path %>`]))
    .pipe(browserSync.stream({ match: BASES.dist }));
});

gulp.task('watch', () => {
  browserSync.create();
  browserSync.init({
    injectChanges: true,
    server: `${BASES.root}`,
  });
  gulp.watch(PATH.html, ['html']);
  gulp.watch(PATH.resume, ['exportResume']);
  gulp.watch(PATH.images, ['imagemin']);
  gulp.watch(PATH.scripts, ['eslint', 'scripts']);
  gulp.watch(PATH.styles, ['stylelint', 'styles']);
});

gulp.task('build', ['html', 'stylelint', 'styles', 'eslint', 'scripts', 'imagemin', 'exportResume']);
gulp.task('serve', ['build', 'watch']);
