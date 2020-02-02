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
gulp.task('html', (done) => {
  gulp.src(CONFIG.path.html)
    .pipe(gulp.dest(CONFIG.bases.root));
  done();
});

// Process SCSS files and concatenate them into one output file
gulp.task('stylelint', (done) => {
  pump([
    gulp.src(CONFIG.path.styles),
    $.stylelint({ reporters: [{ formatter: 'string', console: true }] }),
  ], done);
});

// Process SCSS files and concatenate them into one output file
gulp.task('styles', gulp.series('stylelint', (done) => {
  pump([
    gulp.src(CONFIG.path.styles),
    $.if(CONFIG.sourcemap, $.sourcemaps.init()),
    $.sass().on('error', $.sass.logError),
    $.autoprefixer(),
    $.rename({ basename: 'style', suffix: '.min' }),
    $.cleanCss(),
    $.if(CONFIG.sourcemap, $.sourcemaps.write('/')),
    gulp.dest(CONFIG.bases.dist),
    browserSync.stream({ match: CONFIG.path.dist }),
  ], done);
}));

// Lint JS code with ESLint
gulp.task('eslint', (done) => {
  pump([
    gulp.src(CONFIG.path.scripts),
    $.eslint(),
    $.eslint.format(),
    $.eslint.failAfterError(),
  ], done);
});

// Transpile JS code
gulp.task('scripts', gulp.series('eslint', (done) => {
  pump([
    browserify({ entries: CONFIG.path.app, debug: true })
      .transform(babelify, { presets: ['@babel/preset-env'], sourceMaps: true })
      .bundle(),
    vinylSource('app.min.js'),
    vinylBuffer(),
    $.if(CONFIG.sourcemap, $.sourcemaps.init({ loadMaps: true })),
    $.uglify(),
    $.if(CONFIG.sourcemap, $.sourcemaps.write('/')),
    gulp.dest(CONFIG.bases.dist),
    browserSync.stream({ match: CONFIG.path.dist }),
  ], done);
}));

// Minify images, output them in dist
gulp.task('imagemin', (done) => {
  gulp.src(CONFIG.path.images)
    .pipe($.imagemin())
    .pipe(gulp.dest(CONFIG.bases.images))
    .pipe(browserSync.stream({ match: CONFIG.bases.dist }));
  done();
});

gulp.task('watch', (done) => {
  browserSync.create();
  browserSync.init({
    injectChanges: true,
    server: `${CONFIG.bases.root}`,
  });

  gulp.watch(CONFIG.path.html, gulp.series('html')).on('change', browserSync.reload);
  gulp.watch(CONFIG.path.images, gulp.series('imagemin'));
  gulp.watch(CONFIG.path.scripts, gulp.series('scripts'));
  gulp.watch(CONFIG.path.styles, gulp.series('styles'));
  done();
});

gulp.task('build', gulp.series('html', 'imagemin', 'styles', 'scripts'));
gulp.task('serve', gulp.series('build', 'watch'));
