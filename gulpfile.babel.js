import gulp from 'gulp';
import browserSync from 'browser-sync';

// CSS
import autoprefixer from 'gulp-autoprefixer';
import minifycss from 'gulp-clean-css';
import concat from 'gulp-concat';
import imagemin from 'gulp-imagemin';
import sass from 'gulp-sass';

// JAVASCRIPT
import eslint from 'gulp-eslint';
import browserify from 'browserify';
import babelify from 'babelify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import uglify from 'gulp-uglify';
import sourcemaps from 'gulp-sourcemaps';

const bases = {
  app: 'src/',
  dist: 'dist/',
};

const paths = {
  app: 'src/js/src.js',
  scripts: ['src/js/**/*.js', '!js/libs/**/*.js'],
  styles: ['src/styles/**/*.scss', 'src/styles/**/*.sass', 'src/styles/**/*.css'],
  html: ['src/**/*.html'],
  images: ['src/images/*'],
};

// Copy HTML file over to /dist
gulp.task('html', () => {
  gulp.src(paths.html)
    .pipe(gulp.dest(bases.dist))
    .pipe(browserSync.stream({ match: paths.dist }));
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

gulp.task('lint', () => {
  // ESLint ignores files with "node_modules" paths.
  // So, it's best to have gulp ignore the directory as well.
  // Also, Be sure to return the stream from the task;
  // Otherwise, the task may end before the stream has finished.
  gulp.src(['**/*.js', '!node_modules/**'])
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failAfterError());
});

gulp.task('scripts', () => {
  // app.js is your main JS file with all your module inclusions
  browserify({ entries: paths.app, debug: true })
    // .transform(babelify, { presets: ['es2015'] })
    .transform(babelify, { presets: ['es2015'], sourceMaps: true })
    .bundle()
    .pipe(source('app.min.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    // .pipe(uglify({ compress: false }))
    .pipe(uglify())
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest(bases.dist));
});

// Imagemin images and ouput them in dist
gulp.task('imagemin', () => {
  gulp.src(paths.images)
    .pipe(imagemin())
    .pipe(gulp.dest(`${bases.dist}images/`))
    .pipe(browserSync.stream({ match: paths.dist }));
});

browserSync.create();
gulp.task('watch', () => {
  browserSync.init({
    injectChanges: true,
    server: `./${bases.dist}`,
  });
  gulp.watch(paths.html, ['html']);
  gulp.watch(paths.styles, ['styles']);
  gulp.watch(paths.scripts, ['lint', 'scripts']);
  gulp.watch(paths.images, ['imagemin']);
});

gulp.task('serve', ['html', 'styles', 'lint', 'scripts', 'imagemin', 'watch']);
