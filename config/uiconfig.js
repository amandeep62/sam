// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
'use strict';
requirejs.config({
    waitSeconds : 30,
    baseUrl: '../lib/',
    paths: {
        jquery: 'jquery/dist/jquery.min',
        Mustache: 'mustache.js/mustache.min',
        keycloak: 'keycloak/dist/keycloak.min',
        sockjs: 'sockjs-client/dist/sockjs.min',
        stomp: 'stomp-websocket/lib/stomp.min',
        darktooltip: 'darktooltip/dist/jquery.darktooltip',
        cookie: 'js-cookie/src/js.cookie',
        humps: 'humps/humps',
        text : 'requirejs-plugins/lib/text',
        json : 'requirejs-plugins/src/json',
        animateCss: '../js/animateCss',
        jqueryFileDownload: 'jquery-file-download/src/Scripts/jquery.fileDownload',
        endPoint: '../js/endPoint',
        login: '../js/login',
        rtlApis: '../js/rtlApis',
        mock : '../mock',
        app: '../js/app',
        mst: '../js/mst',
        appActions: '../js/appActions'
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
            location: 'moment',
            main: 'moment'
        }
    ]
});

// Start loading the main app file. Put all of
// your application logic in there.
requirejs(['login','app', 'json!mock/userToken.json'], function (login, app, userToken) {

    /*var inIframe = function () {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    };

    var msieversion = function()
    {
        var ua = window.navigator.userAgent;
        var msie = ua.indexOf('MSIE ');
        if (msie > 0) {
            return true;
        }
        var trident = ua.indexOf('Trident/');
        if (trident > 0) {
            return true;
        }
        var edge = ua.indexOf('Edge/');
        if (edge > 0) {
            return true;
        }
        return false;
        //return true;
        /!*if (msie > 0) // If Internet Explorer, return version number
        {
            //alert(parseInt(ua.substring(msie + 5, ua.indexOf(".", msie))));
            return true;
        }
        else  // If another browser, return 0
        {
            //alert('otherbrowser');
            return false;
        }*!/
        //return false;
    };

    if(msieversion()){
        $('.container').addClass('flexed flex-column txt-center').html('<span class="icon-warning alertIe"></span><br />Please use Chrome for best experience.<br />We are working on IE Support').hide().fadeIn('slow')
    } else {
        if (inIframe()) {
            var url_string = window.location.href;
            var url = new URL(url_string);
            var token = url.searchParams.get("token");
            //userToken[0].token = token;
            $.ajax({
                type: 'GET',
                url: 'https://' + window.location.host + '/token-conversion-service/api/user/token=' + token + '/',
                processData: true,
                dataType: "json",
                contentType: "application/json;charset=utf-8",
                crossDomain: true,
                enctype: false,
                cache: false,
                success: function (res) {
                    userToken[0] = {
                        name : res.firstName,
                        userName : res.firstName + ' ' + res.lastName,
                        email : res.email,
                        token : res.token
                    };
                    app.reservationStatus(1, userToken[0], null);
                },
                error: function (err) {
                    console.log('Error : Your JWT Token is expired');
                    $('.container').addClass('flexed flex-column txt-center').html('<span class="icon-warning alertIe"></span><br />Session Expired<br />Thank you for using Cloud Device Service.<br />Please login to samsungdevelopers.com for new session.').hide().fadeIn('slow')
                    //callback(err);
                }
            });
        } else {
            login.start(function (userInfo) {
                //$(document).on("keydown", disableF5);
                app.reservationStatus(0, userInfo);
            });
        }
    }

    function disableF5(e) {
        if ((e.which || e.keyCode) == 116 || (e.which || e.keyCode) == 82) {
            e.preventDefault();
            console.log("blocked a refresh " + window.location);
        }
    };*/

    //Hard Coded for localhost testing
    app.reservationStatus(0, userToken[0], userToken);
});
