import gulp from 'gulp';
import browserSync from 'browser-sync';

// CSS
import autoprefixer from 'gulp-autoprefixer';
import minifycss from 'gulp-clean-css';
import concat from 'gulp-concat';
import imagemin from 'gulp-imagemin';
import sass from 'gulp-sass';

// JAVASCRIPT
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
  app: 'src/js/app.js',
  scripts: ['src/js/**/*.js', '!js/libs/**/*.js'],
  styles: ['src/styles/**/*.scss', 'src/styles/**/*.sass', 'src/styles/**/*.css'],
  html: ['src/**/*.html'],
  images: ['src/images/*'],
};

// Copy HTML file over to /dist
gulp.task('html', () => {
  gulp.src(paths.html)
    .pipe(gulp.dest(bases.dist))
    .pipe(browserSync.stream({
      match: paths.dist,
    }));
});

// Process SCSS files and concatenate them into one output file
gulp.task('styles', () => {
  gulp.src(paths.styles)
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compressed',
    }).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: [
        'last 2 versions',
      ],
    }))
    .pipe(concat('style.min.css'))
    .pipe(minifycss())
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest(bases.dist))
    .pipe(browserSync.stream({ match: paths.dist }));
});

gulp.task('scripts', () => {
  // app.js is your main JS file with all your module inclusions
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

// Imagemin images and ouput them in dist
gulp.task('imagemin', () => {
  gulp.src(paths.images)
    .pipe(imagemin())
    .pipe(gulp.dest(`${bases.dist}images/`))
    .pipe(browserSync.stream({
      match: paths.dist,
    }));
});

gulp.task('watch', () => {
  browserSync.create();
  browserSync.init({
    injectChanges: true,
    server: `./${bases.dist}`,
  });
  gulp.watch(paths.html, ['html']);
  gulp.watch(paths.styles, ['styles']);
  gulp.watch(paths.scripts, ['lint', 'scripts']);
  gulp.watch(paths.images, ['imagemin']);
});

gulp.task('serve', ['html', 'styles', 'scripts', 'imagemin', 'watch']);
gulp.task('build', ['html', 'styles', 'scripts', 'imagemin']);
