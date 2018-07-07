'use strict';
define(['keycloak'], function (keycloak) {
    var serverLb = window.location.host === 'localhost:8080' ? 'dev.seacvl.com' : window.location.host;
    var token = keycloak.token;
    var baseUrl = 'https://' + serverLb;
    var keycloakConfig = function () {
        return {
            'url': baseUrl + '/auth',
            'realm': 'haystack',
            'clientId': 'haystack-ui',
            'credentials' : {'secret' : '02bac2f1-e399-44d5-a39b-db8fe1004711'}
        };
    };
    return {
        serverLb : serverLb,
        baseUrl : baseUrl,
        keycloakConfig : keycloakConfig,
        token: token
    };
});
