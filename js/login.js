'use strict';
define(['jquery', 'cookie', 'keycloak','endPoint', 'app', 'appActions'],
    function ($, cookie, keycloak, endPoint, app, appActions) {
    var that = {};
    that.loggedInUserInfo = {
        "name": null,
        "userName": null,
        "email": null,
        "token" : null
    };
    that.keycloakConfig = endPoint.keycloakConfig();
    that.keycloak = keycloak(that.keycloakConfig);

    var start = function (callback) {
        that.keycloak.init({onLoad: 'login-required'}).success(function(authenticated) {
            if(authenticated){
                that.keycloak.loadUserInfo().success(function (userInfo){
                    that.loggedInUserInfo.name = userInfo.name;
                    that.loggedInUserInfo.userName = userInfo.preferred_username;
                    that.loggedInUserInfo.email = userInfo.email;
                    that.loggedInUserInfo.token = that.keycloak.token;
                    that.loggedInUserInfo.devRole = (function () {
                        for(var i = 0; i < that.keycloak.realmAccess.roles.length ; i++){
                            if(that.keycloak.realmAccess.roles[i] === "ROLE_DEVELOPER"){
                                return true;
                            }
                        }
                    })();
                    callback(that.loggedInUserInfo);
                }).error(function(){
                    alert('unable to load userInfo');
                });
            }
        });
    };

    $('.container').on('click','#log-out', function () {
        if(window.location.hostname === 'localhost') {
            cookie.remove('existingToken');
            location.reload();
        } else {
            appActions.disconnect('logout', function (res) {
                if (res === 'complete')
                    that.keycloak.logout();
            });
        }
    });

    return{
        start: start
    }

});




