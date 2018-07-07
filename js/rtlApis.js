'use strict';
define(['jquery', 'cookie', 'endPoint'], function ($, cookie, endPoint) {
    var path = function (url, rId) {
        if(url === 'ffmpeg-service/api/log/' + rId){
            return endPoint.baseUrl + '/ffmpeg-service/api/log/' + rId;
        } else {
            return endPoint.baseUrl + '/' + url;
        }
    };
    var rtlApi = function (reqType, params, data, service, callback) {
        $.ajax({
            type: reqType,
            url: path(service, params.rId),
            processData: params.processData,
            data: data,
            dataType: 'json',
            contentType: params.contentType,
            crossDomain: params.crossDomain,
            enctype: params.enctype,
            cache: false,
            beforeSend: function (xhr) {
                xhr.withCredentials = true;
                xhr.setRequestHeader('Authorization', 'bearer ' + params.token);
            },
            success: function (res) {
                callback(res);
            },
            error: function (err) {
                callback(err);
                if(reqType !== 'DELETE') {
                    console.log('Error :' + path(service));
                }
            }
        });
    };
    return{
        rtlApi : rtlApi
    }
});
