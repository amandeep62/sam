var gulp = require('gulp');
var del = require('del');
var argv = require('yargs').argv
var rbuild = require('./gulp.build');
var config = require('./gulp.config');
var $ = require('gulp-load-plugins')({lazy: true});

var log = function(msg){
    if(typeof(msg)==='object'){
        for (var item in msg){
            if(msg.hasOwnProperty(item)){
                $.util.log($.util.colors.yellow(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.yellow(msg));
    }
};

var gClean = function(path){
    log('Cleaning: ' + $.util.colors.yellow(path));
    return del(path);
}

gulp.task('cleanup', function(){
    return gClean(config.dist);
});

gulp.task('build', ['cleanup'], function(){
    log('Started JS Minification Process');
    return gulp.src(['./js/*.js','./config/*.js'])
        .pipe($.if(argv.verbose, $.print.default()))
        .pipe($.uglify())
        .pipe(gulp.dest(config.jsDir));
});

gulp.task('mainbuild',['build'], function(){
    log('Started Rjs Build');
    return $.rjsOptimizer(rbuild(/*{optimize:'uglify'}*/))
        .pipe($.uglify())
        .pipe(gulp.dest(config.dist));
});

gulp.task('cleanbuild',['mainbuild'], function(){
    log('Removing Uncompressed files');
    del([config.jsDir]);
});

gulp.task('build-watch',function(){
    gulp.watch([config.js], ['cleanbuild']); // Probably Useless
});

/**********************************/

//gulp.task('mst',['cleanbuild'], function(){
gulp.task('mst', function(){
    log('Copied MST Dir & Minification Process');
    return gulp.src(['./uiviews/*.mst'])
        .pipe($.if(argv.verbose, $.print.default()))
        //.pipe($.rev())
        .pipe($.htmlmin({
            collapseWhitespace: true,
            caseSensitive: true,
            removeComments: true,
            customAttrSurround: [ [ /{{\^|{{#+/, /}}/ ], [ /{{\/+/, /}}/ ] ]
        }))
        //.pipe($.revReplace())
        .pipe(gulp.dest(config.mstDir));
});

gulp.task('images',['mst'], function(){
    log('Copied Images Dir');
    return gulp.src(['./images/*.*'])
        .pipe(gulp.dest(config.imgDir));
});


gulp.task('fonts',['images'], function(){
    log('Copied Images Dir');
    return gulp.src(['./fonts/*.*'])
        .pipe(gulp.dest(config.fontsDir));
});

gulp.task('css',['fonts'], function(){
//gulp.task('css', function(){
    log('Copied CSS Dir & Minification Process');
    return gulp.src(['./css/*.css'])
        .pipe($.if(argv.verbose, $.print.default()))
        .pipe($.cleanCss())
        .pipe(gulp.dest(config.cssDir));
});

gulp.task('copyRjs',['css'], function(){
    log('Copied require Js');
    return gulp.src(['./lib/requirejs/*.js'])
        .pipe($.if(argv.verbose, $.print.default()))
        //.pipe($.uglify())
        .pipe(gulp.dest(config.dist));
});

//gulp.task('inject',['copyRjs'], function(){
gulp.task('inject', function(){
    var options = config.getWiredepDefaultOptions();
    var wiredep = require('wiredep').stream;
    log('Started HTML injection Process');
    gulp.src(config.index)
        .pipe($.if(argv.verbose, $.print.default()))
        .pipe(wiredep(options))
        .pipe($.inject(gulp.src(config.cssFiles)))
        .pipe($.rename('index.html'))
        .pipe(gulp.dest(config.dist));
});

/**********************************/

gulp.task('html', function(){
    log('Started HTML Minification Process');
    gulp.src([config.distIndex])
        .pipe($.if(argv.verbose, $.print.default()))
        //.pipe($.stripComments())   // Not required as Comments stripped by htmlMin removeComments -> true
        .pipe($.htmlmin({
            removeComments: true,
            collapseWhitespace: true
        }))
        .pipe(gulp.dest(config.dist));
});
