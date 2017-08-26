const browserSync = require('browser-sync');
const gulp = require('gulp');

// CSS
const autoprefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const imagemin = require('gulp-imagemin');
const minifycss = require('gulp-clean-css');
const sass = require('gulp-sass');

// JAVASCRIPT
const browserify = require('browserify');
const babelify = require('babelify');
const buffer = require('vinyl-buffer');
const eslint = require('gulp-eslint');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');

// SKETCH FILES
const shell = require('gulp-shell');

// constants
const EXPORT_RESUME_SCRIPT_PATH = 'sketch/exportResume.sh';
const RESUME_SKETCH_FILE_PATH = 'sketch/resume.sketch';

const bases = {
  index: './',
  app: 'src/',
  dist: 'dist/',
};

const paths = {
  app: 'src/js/app.js',
  scripts: ['src/js/**/*.js', '!js/libs/**/*.js', '!node_modules/**'],
  styles: ['src/styles/**/*.scss', 'src/styles/**/*.sass', 'src/styles/**/*.css'],
  html: ['src/**/*.html'],
  images: ['src/images/*'],
  resume: [RESUME_SKETCH_FILE_PATH],
};

// Github user pages requires index.html to be in master branch, root dir
gulp.task('html', () => {
  gulp.src(paths.html)
    .pipe(gulp.dest(bases.index))
    .pipe(browserSync.stream({ match: bases.index }));
});

// Process SCSS files and concatenate them into one output file
gulp.task('styles', () => {
  gulp.src(paths.styles)
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compressed',
    }).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
    }))
    .pipe(concat('style.min.css'))
    .pipe(minifycss())
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest(bases.dist))
    .pipe(browserSync.stream({ match: paths.dist }));
});

// Lint javascript code in '/src'
gulp.task('lint', () => {
  gulp.src(paths.scripts)
    .pipe(eslint())
    .pipe(eslint.format());
});

// Transpile javascript code in '/src'
gulp.task('scripts', () => {
  browserify({ entries: paths.app, debug: true })
    .transform(babelify, { presets: ['es2015'], sourceMaps: true })
    .bundle()
    .pipe(source('app.min.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(uglify())
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest(bases.dist));
});

// Minify images, output them in dist
gulp.task('imagemin', () => {
  gulp.src(paths.images)
    .pipe(imagemin())
    .pipe(gulp.dest(`${bases.dist}images/`))
    .pipe(browserSync.stream({ match: bases.dist }));
});

// Run bash script to generate resume .pdf & .png files, output to `/dist`
gulp.task('exportResume', () => {
  gulp.src(paths.resume)
    .pipe(shell([
      `${EXPORT_RESUME_SCRIPT_PATH} <%= file.path %>`,
    ]))
    .pipe(browserSync.stream({ match: bases.dist }));
});

gulp.task('watch', () => {
  browserSync.create();
  browserSync.init({
    injectChanges: true,
    server: `${bases.index}`, // serve files from root dir
  });
  gulp.watch(paths.html, ['html']);
  gulp.watch(paths.styles, ['styles']);
  gulp.watch(paths.scripts, ['scripts']);
  gulp.watch(paths.images, ['imagemin']);
  gulp.watch(paths.resume, ['exportResume']);
});

gulp.task('serve', ['html', 'styles', 'lint', 'scripts', 'imagemin', 'exportResume', 'watch']);
gulp.task('build', ['html', 'styles', 'lint', 'scripts', 'imagemin', 'exportResume']);
