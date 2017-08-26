import browserSync from 'browser-sync';
import gulp from 'gulp';

// CSS
import autoprefixer from 'gulp-autoprefixer';
import concat from 'gulp-concat';
import imagemin from 'gulp-imagemin';
import minifycss from 'gulp-clean-css';
import sass from 'gulp-sass';

// JAVASCRIPT
import browserify from 'browserify';
import babelify from 'babelify';
import buffer from 'vinyl-buffer';
import eslint from 'gulp-eslint';
import source from 'vinyl-source-stream';
import sourcemaps from 'gulp-sourcemaps';
import uglify from 'gulp-uglify';

// SKETCH FILES
import shell from 'gulp-shell';

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
