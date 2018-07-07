'use strict';
define(['jquery', 'animateCss', 'moment', 'sockjs', 'stomp', 'cookie', 'rtlApis', 'endPoint'],
    function ($, animateCss, moment, SockJS, stomp, cookie, rtlApis, endPoint) {
    var $container = $('.container');
    var that = {};
    that.jc = {
        'type': null,
        'payload': null,
        'screenCoordinates': {
            'x': null,
            'y': null
        },
        'resolution': {
            'height': null,
            'width': null
        }
    };
    that.mouseState = null;
    that.devicefocus = false;
    that.hold = false;
    that.drag = false;
    that.mouseReleasedTime = 0;
    that.longPress = false;
    that.stompClient = null;
    that.setConnected = false;
    that.params = {
        processData : true,
        contentType: "application/json;charset=utf-8",
        crossDomain: true,
        enctype: false,
        token: null,
        rId: null
    };
    that.getCanvas = null;
    that.byteLength = 0;
    that.showingFrameSn = 0;
    that.img = null;
    that.contentType = 'image/png';
    that.blob = null;
    that.blobUrl = null;
    that.userMsg = { cls: 'upload-success', msg: 'Upload successful' };
    that.dId = null;
    that.rId = null;
    that.currentTimeStamp = moment.utc().valueOf();
    that.analyticData = [];
    that.socketNext = null;
    that.naturalHgt = 0;
    that.naturalWth = 0;

    var startRemoteDesktop = function () {
        that.jc.type = 'RemoteDesktop';
        var tmp = JSON.stringify(that.jc);
        console.log(tmp);
        that.stompClient.send('/socket/rtl/ui/device/screen/' + that.dId, {"reservation-id": that.rId}, tmp);
    };

    var displayLogs = function (data) {
        var maxLength = 5000;
        var text;
        var $logsView = $(".logs .panel-view");
        var message = JSON.parse(data).payload + "\n";
        if (message.length >= maxLength) {
            text = message.substring(message.length - maxLength, message.length);
        } else {
            // Get existing text from the element
            // Append incoming message
            text = $logsView.text() + message;
            if (text.length >= maxLength) {
                // Keep the last maxLength chars
                text = text.substring(Math.min(text.length - maxLength, maxLength), text.length);
            }
        }
        $logsView.text(text);
    };

    var calculateAspectRatioFit = function (srcWidth, srcHeight, maxWidth, maxHeight) {
        var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        return { width: srcWidth*ratio, height: srcHeight*ratio };
    }

    var displayImage = function (data) {
        cmds("captureDispatched", "");
        that.byteLength += data.body.length;
        that.showingFrameSn = data.headers.sn;
        that.imagePayload = data.body;
        var delayedBy = moment.duration(data.headers.ts - that.currentTimeStamp);
        $('#bpsCount').text(that.byteLength);
        that.byteLength = 0;
        $('#showingFrameSn').text(that.showingFrameSn);
        $('#frameTS').text(delayedBy.milliseconds()+'ms');
        that.img = new Image();
        that.img.src = 'data:image/jpeg;base64,'+ that.imagePayload;
        that.img.onload = function(){
            that.naturalHgt = this.height;
            that.naturalWth = this.width;
            that.jc.resolution.height = this.height;
            that.jc.resolution.width = this.width;
            that.img = null;
            URL.revokeObjectURL(that.blobUrl);
        };
        that.blob = b64toBlob(that.imagePayload, that.contentType);
        that.blobUrl = URL.createObjectURL(that.blob);
        $('.loader').remove();
        var $bitmapNode = $('#bitmapdata');
        $bitmapNode.attr('src', that.blobUrl);
        that.analyticData.push({
            "deviceId": that.dId,
            "eventType": "remoteDesktop",
            "frameNumber": parseInt(that.showingFrameSn),
            "latencyInMilliSec": delayedBy.milliseconds(),
            "reservationId": that.rId
        });
        if(that.analyticData.length > 5000) {
            rtlApis.rtlApi('POST', that.params, JSON.stringify(that.analyticData), 'reservation-service/api/analytics', function (res){});
            that.analyticData = [];
        }
        var $phoneBody = $('#phoneBody'),
            panelWidth  = $phoneBody.width(),
            panelHeight = $phoneBody.height(),
            screenWidth  = $bitmapNode.prop('naturalWidth'),
            screenHeight = $bitmapNode.prop('naturalHeight'),
            imgDimension = calculateAspectRatioFit(screenWidth,screenHeight, panelWidth - 60 , panelHeight - 100);
        $bitmapNode.css(imgDimension);
    };


    var connect = function (dId, rId, token) {
        that.dId = dId;
        that.rId = rId;
        that.params.rId = rId;
        that.params.token = token;
        console.log("Started WS connect");
        var headers = {"reservation-id": that.rId};
        var sockerUrl = endPoint.serverLb + '/stream-service/web-socket';
        var httpUrl = 'https://' + sockerUrl;

        //var socketUrl2 = 'ws://test-app-vasu-1.9tqadpnmdp.us-east-2.elasticbeanstalk.com/consumer-ctrl/123';

        var socket = new SockJS(httpUrl);
        /*that.socketNext = new WebSocket(socketUrl2);

        that.socketNext.onopen = function () {
            console.log("consumer-ctrl got connected");
        };
        that.socketNext.onmessage = function (msg) {
            console.log(msg);
        };*/

        that.stompClient = Stomp.over(socket);
        that.stompClient.debug = null;
        that.stompClient.heartbeat.outgoing=30000;
        that.stompClient.heartbeat.incoming=30000;

        that.stompClient.connect(headers, function (frame) {
            that.setConnected = true;
            $('#showBps').html('Bps: <span id="bpsCount"></span><br />Frame D: <span id="dispatchCount"></span><br />UI Frame: <span id="showingFrameSn"></span><br />Frame TS: <span id="frameTS"></span><br />Remote TS: <span id="remoteTS"></span>');
            that.stompClient.subscribe('/topic/response/rtl/ui/device/screen/' + that.dId, function (dataResponse) {
                displayImage(dataResponse);
            });
            that.stompClient.subscribe('/topic/response/rtl/ui/device/logs/' + that.dId, function (dataResponse) {
                displayLogs(dataResponse.body);
            });
            that.stompClient.subscribe('/topic/response/rtl/ui/device/control/' + that.dId, function (dataResponse) {
                var res = JSON.parse(dataResponse.body);
                $('#dispatchCount').text(res.sn);
                switch(res.type) {
                    case "msgApkDownload":
                        apkStatus(res.status);
                        break;
                    case "remoteInjectionFeedback":
                        var remoteTimeStampDiff = moment.duration(res.ts - that.currentTimeStamp);
                        $('#remoteTS').text(remoteTimeStampDiff.milliseconds() +'ms');
                        that.analyticData.push({
                            "deviceId": that.dId,
                            "eventType": "remoteInjection",
                            "frameNumber": parseInt(that.showingFrameSn),
                            "latencyInMilliSec": remoteTimeStampDiff.milliseconds(),
                            "reservationId": that.rId
                        });
                        break;
                    case "msgScreenshot":
                        var blob = b64toBlob(res.payload, 'image/png');
                        var blobUrl = URL.createObjectURL(blob);
                        $("#previewImage").html("<img src="+ blobUrl +" />");
                        break;
                }
            });
            startRemoteDesktop();
        });
    };

    $container.on('mouseenter mouseleave mouseup mousemove mousedown dragstart', '#bitmapdata', function(e, data) {
        var tmp;
        switch(e.type) {
            case 'mousedown':
                that.mouseState = 'down';
                setTimeout(function(){ that.hold = true; }, 10);
                tmp = {
                    resolution: that.jc.resolution,
                    screenCoordinates: {
                        'x': ((e.offsetX * that.jc.resolution.height / this.height) + 2),
                        'y': ((e.offsetY * that.jc.resolution.width / this.width) - 2)
                    },
                    type: 'freeDraw',
                    payload: {state: 'start'}
                };
                that.stompClient.send('/socket/rtl/ui/device/tracker/' + that.dId, {'reservation-id': that.rId}, JSON.stringify(tmp));
                break;
            case 'mousemove':
                if(that.hold) {
                    tmp = {
                        resolution: that.jc.resolution,
                        screenCoordinates: {
                            'x': ((e.offsetX * that.jc.resolution.height / this.height) + 2),
                            'y': ((e.offsetY * that.jc.resolution.width / this.width) - 2)
                        },
                        type: 'freeDraw',
                        payload: {state: 'on'}
                    };
                    that.stompClient.send('/socket/rtl/ui/device/tracker/' + that.dId, {'reservation-id': that.rId}, JSON.stringify(tmp));
                }
                break;
            case 'mouseup':
                if(that.mouseState === 'down') {
                    that.mouseState = 'up';
                    that.hold = false;
                    tmp = {
                        resolution: that.jc.resolution,
                        screenCoordinates: {
                            'x': (((data ? data.offsetDataX : e.offsetX) * that.jc.resolution.height / this.height) + 2),
                            'y': (((data ? data.offsetDataY : e.offsetY) * that.jc.resolution.width / this.width) - 2)
                        },
                        type: 'freeDraw',
                        payload: {state: 'end'}
                    };
                    that.stompClient.send('/socket/rtl/ui/device/tracker/' + that.dId, {'reservation-id': that.rId}, JSON.stringify(tmp));
                }
                break;
            case 'mouseleave':
                that.hold = false;
                that.devicefocus = false;
                $(this).trigger('mouseup', [{offsetDataX:e.offsetX, offsetDataY:e.offsetY}]);
                break;
            case 'mouseenter':
                that.devicefocus = true;
                $(document.activeElement).trigger('blur');
                break;
            case 'dragstart':
                return false;
        }
    });

    window.addEventListener('keyup', function(e) {
        if(that.setConnected && e.keyCode !== 16 && that.devicefocus) {
            var tmp = JSON.stringify({type : "KEYCODE",payload : { "key": e.keyCode.toString(), "shiftKey": e.shiftKey }});
            that.stompClient.send('/socket/rtl/ui/device/tracker/' + that.dId, {"reservation-id": that.rId}, tmp);
        }
    });

    var toolAction = function (keycode, channel) {
        var tmp;
        that.jc.type = keycode;
        that.jc.payload = keycode;
        var searchPattern = new RegExp('^' + 'SWIPE', 'i');
        if (searchPattern.test(keycode)) {
            var swipe = keycode.replace('SWIPE_','');
            that.jc.screenCoordinates.x = that.naturalWth/2;
            that.jc.screenCoordinates.y = that.naturalHgt/2;
            switch(swipe) {
                case 'TOP':
                    that.jc.screenCoordinates.x1 = that.naturalWth/2;
                    that.jc.screenCoordinates.y1 = 0;
                    break;
                case 'LEFT':
                    that.jc.screenCoordinates.x1 = 0;
                    that.jc.screenCoordinates.y1 = that.naturalHgt/2;
                    break;
                case 'BOTTOM':
                    that.jc.screenCoordinates.x1 = that.naturalWth/2;
                    that.jc.screenCoordinates.y1 = that.naturalHgt;
                    break;
                case 'RIGHT':
                    that.jc.screenCoordinates.x1 = that.naturalWth;
                    that.jc.screenCoordinates.y1 = that.naturalHgt/2;
                    break;
            }
            tmp = JSON.stringify({
                resolution : that.jc.resolution,
                screenCoordinates : that.jc.screenCoordinates,
                type : that.jc.type
            });
        } else {
            tmp = JSON.stringify({ type : 'TOOLBAR', payload : { key : keycode }});
        }
        that.stompClient.send('/socket/rtl/ui/device/' + channel + '/' + that.dId, {}, tmp);
    };

    var logs = function (flag, target) {
        cmds("cmdClearLogs",null);
        cmds(flag, target);
        $('.logs > .panel-view').empty();
        that.jc.type = "logLevel";
        that.jc.payload = target;
        var tmp = JSON.stringify(that.jc);
        console.log(tmp);
        that.stompClient.send('/socket/rtl/ui/device/logs/' + that.dId, {"reservation-id": that.rId}, tmp);
    };

    var cmds = function (cmd, target) {
        if (cmd === "cmdScreenshot"){
            var tmp = JSON.stringify({ type : cmd, payload : target });
            that.stompClient.send('/socket/rtl/ui/device/control/' + that.dId, {}, tmp);
        } else if (cmd !== "captureDispatched") {
            var tmp = JSON.stringify({ type : cmd, payload : target });
            that.stompClient.send('/socket/rtl/ui/device/control/' + that.dId, {}, tmp);
            rtlApis.rtlApi('DELETE', that.params, null, 'ffmpeg-service/api/log/'+ that.rId, function (res) {
                $('.logs.panel .panel-view').text('');
            });
        }
    };

    var disconnect = function (callReq, callback) {
        //that.socketNext.close();
        that.jc.type = 'disconnect';
        that.jc.payload = '';
        var tmp = JSON.stringify(that.jc);
        if(that.stompClient !== null) {
            that.stompClient.send('/socket/rtl/ui/device/screen/' + that.dId, {"reservation-id": that.rId}, tmp);
            that.stompClient.send('/socket/rtl/ui/device/logs/' + that.dId, {"reservation-id": that.rId}, tmp);
            Wipe();  // Clean Up is required before disconnect or Logout call
            that.stompClient.disconnect();
        }
        that.setConnected = false;
        if(that.rId) {
            rtlApis.rtlApi('GET', that.params, null, 'reservation-service/api/reservations/' + that.rId + '/release', function (res) {
                console.log("reservationData " + JSON.stringify(res));
                if (res.reservationStatus == "complete") {
                    console.log("reservation status  is complete");
                    if (callReq === 'logout') {
                        callback(res.reservationStatus);
                    } else {
                        callback(true);
                    }
                }
            });
        } else {
            callback('complete');
        }
    };

    var Wipe = function () {
        that.jc.type = 'clean-up';
        that.jc.payload = 'device';
        var tmp = JSON.stringify(that.jc);
        that.stompClient.send('/socket/rtl/ui/device/screen/' + that.dId, {"reservation-id": that.rId}, tmp);
    };

    var uploadapk = function (e) {
        e.preventDefault();
        var formData = new FormData();
        var apkUpload = $('ins .apkUpload');
        var $ele = $('ins .apk-view > .apkStatus');
        if(apkUpload[0].files.length >= 1) {
            if(apkUpload[0].files[0].size === 0){
                errorOnUpload($ele, 'Invalid APK');
                return;
            }
            apkStatus('uploadStarted');
            $('.apkStatus').empty();
            formData.append('file', apkUpload[0].files[0]);
            var serviceUrl = 'upload-service/api/files';
            var url = serviceUrl;
            var params = that.params;
            params.processData = false;
            params.contentType = false;
            params.enctype = 'multipart/form-dat;charset=UTF-8';
            rtlApis.rtlApi('POST', params, formData, url, function (res) {
                if (res.statusText && res.statusText === "error") {
                    console.log('Error : error back from Server');
                } else if (res.files[0].key !== undefined) {
                    apkStatus('uploadCompleted');
                    that.jc.type = 'install';
                    that.jc.payload = res.files[0].url !== undefined ? res.files[0].url : '';
                    //console.log("that.jc payload info" + that.jc.payload);
                    var tmp = JSON.stringify(that.jc);
                    that.stompClient.send('/socket/rtl/ui/device/screen/' + that.dId, {}, tmp);
                }
            });
        } else {
            errorOnUpload($ele, 'Please Choose File First');
        }
    };

    var errorOnUpload = function (ele, errMsg) {
        $('.apkStatus').html('<span class="upload-error">' + errMsg + '</span>').animateCss('flash');
    };

    var apkStatus = function (status) {
        //var isPopupOpen = $('ins .apk-view');
        //var view = isPopupOpen.is(':visible') ? isPopupOpen : $('#def-apk.apk');
        var view = $('ins .apk-view');
        var apkStatus = view.find('.apkStatus');
        var apkProgress = view.find('.loadProgress');
        var apkButton = view.find('.upload-btn');
        var apkStatusText = view.find('.upload-btn-text');
        switch(status) {
            case "uploadStarted":
                apkProgress.width('10%');
                that.userMsg = { cls: 'progressStatus', msg: 'Uploading started' };
                break;
            case "uploadCompleted":
                apkProgress.width('30%');
                that.userMsg = { cls: 'progressStatus', msg: 'APK Uploaded' };
                break;
            case "downloadStarted":
                apkProgress.width('40%');
                that.userMsg = { cls: 'progressStatus', msg: 'APK Download Started' };
                break;
            case "downloadCompleted":
                apkProgress.width('60%');
                that.userMsg = { cls: 'progressStatus', msg: 'APK installation started' };
                break;
            case "downloadFailed":
                apkProgress.width('70%');
                that.userMsg = { cls: 'progressStatus error', msg: 'APK Download Failed' };
                break;
            case "installFailed":
                apkProgress.width('70%');
                that.userMsg = { cls: 'progressStatus error', msg: 'APK Installation Error' };
                resetAPKview();
                break;
            case "installCompleted":
                apkProgress.width('100%');
                that.userMsg = { cls: 'progressStatus', msg: 'Installation Done' };
                apkStatus.html('<span class="upload-success"><span class="icon-checkmark"></span> Successfully Installed</span>');
                resetAPKview();
                break;
            default:
                console.log('Nothing happens reached default on Upload Message')
        }
        if(apkStatus.find('span').hasClass('upload-success')) {
            $('.upload-success' ).animateCss('flash');
        } else if(apkStatus.find('span').hasClass('upload-error')) {
            $('.upload-error' ).animateCss('flash');
        }else {
            apkButton.removeClass('error').addClass(that.userMsg.cls);
            apkStatusText.text(that.userMsg.msg);
        }
    };

    var resetAPKview = function () {
        $('#darktooltip-def-apk, .darktooltip-modal-layer').fadeOut('slow',function () {
            setTimeout(function () {
                $('.loadProgress').width('0');
                $('.upload-btn').removeClass('progressStatus');
                $('.upload-btn-text').text('Upload');
                $('.apk-view .apkStatus').empty();
            }, 1000);
        });
    };

    /****** Screenshot function start   ********/

    var takeScreenshot = function () {
        cmds("cmdScreenshot", null);
        var contentType = 'image/png';
        var b64Data = that.imagePayload;
        var blob = b64toBlob(b64Data, contentType);
        var blobUrl = URL.createObjectURL(blob);
        $("#previewImage").append("<img src="+ blobUrl +" />");
    };


    var downloadScreenshot = function () {
        $("#btn-Convert-Html2Image").attr("download", "remote_desktop_screenshot.png").attr("href", $("#previewImage >img").attr('src'));
    };

    var b64toBlob = function (b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;
        var byteCharacters = atob(b64Data);
        var byteArrays = [];
        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);
            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        var blob = new Blob(byteArrays, {type: contentType});
        return blob;
    };

    /****** Screenshot function end   ********/

    return {
        connect : connect,
        Wipe: Wipe,
        logs : logs,
        cmds : cmds,
        takeScreenshot : takeScreenshot,
        downloadScreenshot : downloadScreenshot,
        uploadapk: uploadapk,
        toolAction : toolAction,
        disconnect : disconnect
    }
});
