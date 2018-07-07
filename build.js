({
    baseUrl: ".",
    paths: {
        jquery: './lib/jquery/dist/jquery.min',
        Mustache: './lib/mustache.js/mustache.min',
        keycloak: './lib/keycloak/dist/keycloak.min',
        sockjs: './lib/sockjs-client/dist/sockjs.min',
        stomp: './lib/stomp-websocket/lib/stomp.min',
        darktooltip: './lib/darktooltip/dist/jquery.darktooltip',
        cookie: './lib/js-cookie/src/js.cookie',
        humps: './lib/humps/humps',
        text : './lib/requirejs-plugins/lib/text',
        json : './lib/requirejs-plugins/src/json',
        animateCss: './js/animateCss',
        jqueryFileDownload: './lib/jquery-file-download/src/Scripts/jquery.fileDownload',
        endPoint: './js/endPoint',
        login: './js/login',
        rtlApis: './js/rtlApis',
        mock : './mock',
        app: './js/app',
        mst: './js/mst',
        appActions: './js/appActions'
    },
    shim: {
        // Saved for Future Use
        darktooltip: {
            deps: ['jquery'],
            exports: 'darktooltip'
        },
        jqueryFileDownload: {
            deps: ['jquery'],
            exports: 'jqueryFileDownload'
        },
        animateCss: {
            deps: ['jquery'],
            exports: 'animateCss'
        }
    },
    packages: [
        {
            name: 'moment',
            location: './lib/moment',
            main: 'moment'
        }
    ],
    name: "config/uiconfig.js",
    out: "main-built.js"
})
