module.exports = (function () {
    var app = './dist/';
    return {
        dist : app,
        jsDir : app + 'js',
        js : ['./js/*.js'],
        mstDir : app + 'uiviews',
        fontsDir : app + 'fonts',
        cssDir : app + 'css',
        imgDir : app + 'images',
        libDir : app + 'lib',
        index : 'index2.html',
        distIndex : app + 'index.html',
        jsFiles : app + '*.js',
        cssFiles : ['./css/*.css'],
        bower : {
            json : require('./bower.json'),
            directory: './lib/',
            ignorePath: '../..'
        },
        getWiredepDefaultOptions : function () {
            return {
                bowerJson: this.bower.json,
                directory: this.bower.directory,
                ignorePath: this.bower.ignorePath
            };
        }
    };
})();
