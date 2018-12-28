var gulp = require('gulp');
var del = require('del');
var minifyCSS = require('gulp-csso');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');

const BUILD_DIR = 'build/'
const CSS_BUILD_DIR = `${BUILD_DIR}css/`
const JS_BUILD_DIR = `${BUILD_DIR}js/`
const CSS_DIR = 'css/'
const JS_DIR = 'js/'

const SUPERSELECT_JS = 'SuperSelect.min.js'
const SUPERSELECT_CSS = 'SuperSelect.min.css'

const superselect_css = [
  "css/SuperSelect.css"
]
const superselect_js = [
  "js/SuperSelect.js",
  "js/*.js"
]

gulp.task('superselectcss', function(){
  return gulp.src(superselect_css, {base: CSS_DIR})
    .pipe(concat(SUPERSELECT_CSS))
    .pipe(minifyCSS())
    .pipe(gulp.dest(CSS_BUILD_DIR))
});

gulp.task('superselectjs', function(){
  return gulp.src(superselect_js, {base: JS_DIR})
    .pipe(concat(SUPERSELECT_JS))
    .pipe(uglify())
    .pipe(gulp.dest(JS_BUILD_DIR))
});

gulp.task('clean', function() {
  return del([BUILD_DIR])
})

gulp.task('superselect', gulp.series('superselectjs', 'superselectcss'))
gulp.task('default', gulp.series('superselect'))
