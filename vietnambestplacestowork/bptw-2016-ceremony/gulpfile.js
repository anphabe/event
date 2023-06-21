var gulp = require('gulp'),
    cleanCSS = require('gulp-clean-css'),
    postcss = require('gulp-postcss'),
    sass = require('gulp-ruby-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('autoprefixer'),
    browserSync = require('browser-sync');

var clean = require('gulp-clean');
gulp.task('compile-prod', function () {
    sass('./sass/*.scss', {sourcemap: true})
        .on('error', sass.logError)
        .pipe(postcss([require('postcss-flexbugs-fixes'), autoprefixer({browsers: ['last 3 versions', 'ie >= 8']})]))
        //.pipe(cleanCSS())
        .pipe(gulp.dest('./css'))
        .pipe(browserSync.stream({once: true}));

});


gulp.task('compile-dev', function () {
    sass('./sass/*.scss', {sourcemap: true})
        .on('error', sass.logError)
        .pipe(sourcemaps.init())
        //.pipe(postcss([require('postcss-flexbugs-fixes'), autoprefixer({browsers: ['last 3 versions', 'ie >= 8']})]))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./css'))
        .pipe(browserSync.stream({once: true}));
});


gulp.task('clean-up', function () {
    gulp.src(['css/app.css', 'css/app.css.map'], {force: true, read: false})
        .pipe(clean());
});

gulp.task('watch', function () {
    browserSync.init({
        proxy: "http://event.dev",
        // Open the site in Chrome & Firefox
        browser: ['google-chrome']
    });
    gulp.watch(['./sass/*.scss', './sass/**/*.scss'], ['compile-dev']);

    //   gulp.watch(["css/*.css"]).on('change', browserSync.reload);
})

// The default task (called when you run `gulp` from cli)
// The default task (called when you run `gulp` from cli)
gulp.task('default', ['clean-up', 'compile-dev', 'watch']);

// The default task (called when you run `gulp` from cli)
gulp.task('compile', ['clean-up', 'compile-prod']);

