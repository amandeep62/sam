'use strict';
define(['jquery'], function ($) {
    var mstCache = {}, root = 'uiviews/';
    var runMst = function (path, cb) {
        $.get(path, function (template) {
            mstCache[path.split('/')[1].split('.')[0]] = template;
            cb(template);
        });
    };
    var callMst = function (view, cb) {
        mstCache[view] ? cb(mstCache[view]) : runMst(root + view + '.mst', cb);
    };
    return {
        callMst : callMst
    };
});
