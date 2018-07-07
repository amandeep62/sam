'use strict';
define(['jquery', 'Mustache', 'mst', 'darktooltip', 'animateCss','jqueryFileDownload' , 'cookie', 'moment', 'humps', 'rtlApis', 'appActions', 'json!mock/userToken.json'],
    function ($, Mustache, mst, darktooltip, animateCss, jqueryFileDownload, cookie, moment, humps, rtlApis, appActions, userToken) {
    var mainContent = $('.container');
    var win = $( window );
    var that = {};
    that.userInfo = { name: null };
    that.timeNow = moment.utc(new Date());
    that.timeDiff = 0;
    that.runningTimer = 0;
    that.runningTimerCounter = 0;
    that.startTime = null;
    that.endTime = null;
    that.interval = 0;
    that.targetDevice = null;
    that.dId = null;
    that.rId = null;
    that.params = {
        async: true,
        processData : true,
        contentType: "application/json;charset=utf-8",
        crossDomain: true,
        enctype: false,
        token: null,
        rId: null
    };
    that.isDeveloper = false;
    that.insideIframe = false;
    that.videoHistory = [];
    that.progressSteps = null;
    that.header = null;
    that.viewTrigger = true;
    that.refreshTrigger = true;

    if(navigator.userAgent.indexOf('Safari') !=-1 && navigator.userAgent.indexOf('Chrome') == -1)
    {
        $('body').append('<link rel="stylesheet" type="text/css" href="css/safari.css">');

    }else if(navigator.userAgent.indexOf('Chrome') !=-1){

        $('body').append('<link rel="stylesheet" type="text/css" href="css/chrome.css">');
    }

    mst.callMst('header', function (cb) { that.header = cb; });

    var resetDOM = function () {
        if($('ins').length) { $('ins').remove(); }
        $('.insideApp').removeClass('.insideApp');
    };

    var appState = function () {
        that.timeDiff = 0;
        that.runningTimer = 0;
        that.runningTimerCounter = 0;
        that.startTime = null;
        that.endTime = null;
        that.interval = 0;
        that.rtlState = {
            platforms : {
                android: false,
                tizen: false
            },
            series : [],
            osVersions : [],
            carriers : [],
            models : {
                android :{
                    sSeries : false,
                    noteSeries : false,
                    tabletSeries : false
                },
                tizen : {
                    gearSeries: false,
                    rfSeries: false
                }
            },
            reserve : {
                'models': [],
                'subModels':[]
            }
        };
        mst.callMst('progressSteps', function (cb) { that.progressSteps = cb; });
        resetDOM();
    };

    var platformView = function (iframe, userInfo, deviceStatus) {
        appState();
        that.insideIframe = iframe;
        that.userInfo = Object.assign({}, that.userInfo, userInfo);
        rtlApis.rtlApi('GET', that.params, null, 'device-service/api/platforms', function (platforms) {
            if (platforms.statusText && platforms.statusText === "error") {
                console.log('Error : error back from Server');
            } else {
                for (var i = 0; i < platforms.length; i++) {
                    that.rtlState.platforms[platforms[i].toLowerCase()] = true;
                }
                mst.callMst('selectPlatform', function (cb) {
                    var rendered = Mustache.render(cb, {
                        'platforms': that.rtlState.platforms,
                        'username': userInfo.name,
                        'iFrame': iframe
                    },{
                        header: that.header,
                        progressSteps : that.progressSteps
                    });
                    mainContent.removeAttr('style').addClass(mainContent.hasClass('flexed') ? null : 'flexed flex-column').html(rendered).hide().fadeIn('slow');
                    for(var property in that.rtlState.platforms) {
                        $('#rtl-' + property + ' > img').darkTooltip({
                            trigger: 'click',
                            animation: 'flipIn',
                            gravity: 'south'
                        });
                    }
                });
            }
        });
    };

    var disconnectApp = function () {
        clearInterval(that.runningTimer);
        appActions.disconnect('reload', function (res) {
            if (res) {
                platformView(that.insideIframe, that.userInfo, null);
            }
        });
    };

    var refreshToken = function (err, access) {
        that.params.contentType = 'application/x-www-form-urlencoded';
        rtlApis.rtlApi('POST' ,that.params , access, 'auth/realms/haystack/protocol/openid-connect/token', function (res) {
            $('.login-submit-semicircle-bg.bg2').removeClass('loading');
            if(res.statusText === 'Unauthorized' || res.statusText === 'invalid_grant'){
                alert('Check your credentials.');
                return;
            }
            if(res.statusText === 'error'){
                alert('Please Enable CORS for refresh expired token \nAnd after getting session Disable CORS back.');
            } else {
                cookie.set('expiresIn', that.timeNow.add(res.expires_in, 'seconds'));
                cookie.set('existingToken', res.access_token);
                userToken[0].token = res.access_token;
                reservationStatus(that.insideIframe, userToken[0], userToken);
            }
        });
    };

    var loginView = function (deviceStatus) {
        if(new Date(that.timeNow).getTime() > moment.utc(new Date(cookie.get('expiresIn')).getTime())){
            cookie.remove('existingToken');
        }
        if(cookie.get('existingToken')){
            userToken[0].token = cookie.get('existingToken');
            reservationStatus(that.insideIframe, userToken[0], userToken);
        } else {
            mst.callMst('login', function (cb) {
                var rendered = Mustache.render(cb, {});
                mainContent.addClass('flexed flex-column').html(rendered).hide().fadeIn('slow');
                $('.login-field').keypress(function (e) {
                    if (e.which === 13) { $('.login-submit').trigger('click') }
                });
                $('.login-submit').click(function () {
                    $('.login-submit-semicircle-bg.bg2').addClass('loading');
                    refreshToken(deviceStatus, {
                        'client_id': 'rest-client',
                        'client_secret': 'be0d61f2-ad3f-4fea-9aef-42a47f5a1fe8',
                        'username': $('.login-box > [type="text"]').val(),
                        'password': $('.login-box > [type="password"]').val(),
                        'grant_type': 'password'
                    });
                });
            });
        }
    };

    var modelsView = function (platform) {
        resetDOM();
        rtlApis.rtlApi('GET',that.params,  null, 'device-service/api/platforms/'+platform+'/series', function (modals) {
            if(modals.statusText && modals.statusText === "error"){
                console.log('Error : error back from Server');
            } else {
                var platFlag = platform === 'android';
                var selectedPlatform = function (template) {
                    var selectedPlatform = platFlag ? that.rtlState.models.android : that.rtlState.models.tizen;
                    var rendered = Mustache.render(template, selectedPlatform);
                    $('.platforms').html(rendered);
                    for(var property in selectedPlatform) {
                        $('#rtl-' + property + ' > img').darkTooltip({
                            trigger: 'click',
                            animation: 'flipIn',
                            gravity: 'south'
                        });
                    }
                };

                for (var i = 0; i < modals.length; i++) {
                    var modal = modals[i].toLowerCase();
                    switch(modal) {
                        case 's':
                            that.rtlState.models.android.sSeries = true;
                            break;
                        case 'note':
                            that.rtlState.models.android.noteSeries = true;
                            break;
                        case 'tablet':
                            that.rtlState.models.android.tabletSeries = true;
                            break;
                        case 'rf':
                            that.rtlState.models.tizen.rfSeries = true;
                            break;
                    }
                }
                platFlag ? mst.callMst('selectGalaxy', function (cb) { selectedPlatform(cb); }) : mst.callMst('selectTizen', function (cb) { selectedPlatform(cb); });
            }
        });
    };

    var deviceListView = function (deviceModel) {
        resetDOM();
        mst.callMst('selectDevice', function (cb) {
            var rendered = Mustache.render(cb, {
                'username': that.userInfo.name,
                'iFrame': that.insideIframe});
            $('.platforms').remove();
            $('.mainPanel').append(rendered);
            $('.progressbar li:first-child').addClass('icon-loop2');
            that.rtlState.series.push(deviceModel);
            renderFilter(that.rtlState);
            renderList(that.rtlState, 0);
        });
    };

    var runningTimer = function (flag, now) {
        that.runningTimerCounter = that.runningTimerCounter-1000;
        var diffTime = flag ? now - that.runningTimerCounter : now;
        that.timeDiff = that.endTime.diff(diffTime);
        var tempTime = moment.duration(that.timeDiff);
        if(tempTime.valueOf() < 0){
            disconnectApp();
        }
        return (tempTime.hours() < 10 ? "0"+tempTime.hours() : tempTime.hours()) + ":" + (tempTime.minutes() < 10 ? "0"+tempTime.minutes() : tempTime.minutes()) + ":"+ (tempTime.seconds() < 10 ? "0"+tempTime.seconds() : tempTime.seconds());
    };

    var appView = function (iframe, userInfo, deviceStatus) {
        that.insideIframe = iframe;
        if(deviceStatus) {
            that.dId = deviceStatus.deviceId;
            that.rId = deviceStatus.reservationId;
            that.endTime = moment.utc(deviceStatus.endTime);
        }
        that.userInfo = Object.assign({}, that.userInfo, userInfo);
        mst.callMst('appView-07031140', function (cb) {
            var rendered = Mustache.render(cb, {
                'username': userInfo.name,
                'role': that.isDeveloper,
                'S7': deviceStatus.model === "S7" || deviceStatus.model === "S7 Active",
                'iFrame': iframe
            },{
                header: that.header
            });
            mainContent.removeClass('flexed flex-column').html(rendered).hide().fadeIn('slow');
            $('.historyBtn').addClass('insideApp');
            $('.device-panel').append('<div class="loader"></div>');
            appActions.connect(that.dId, that.rId, that.userInfo.token);
            $('#disconnect').darkTooltip({
                trigger: 'click',
                theme: 'light',
                animation: 'flipIn',
                gravity: 'north',
                confirm: true,
                modal: true,
                onYes: function () {
                    disconnectApp()
                },
                yes: 'Yes',
                no: 'No'
            });
            $('#Wipe').darkTooltip({
                trigger: 'hover',
                animation: 'flipIn',
                gravity: 'north'
            });
            mst.callMst('breadcrumb', function (cb) {
                var rendered = Mustache.render(cb, {
                    'model': deviceStatus.product,
                    'subModel': deviceStatus.model,
                    'osVersion': deviceStatus.osVersion,
                    'deviceId': that.dId,
                    'role': that.isDeveloper,
                    'resTimer': runningTimer(0, moment.utc(deviceStatus.currentServerTime))
                });
                $('.steps.steps-3').append(rendered);
                that.runningTimer = setInterval(function(){
                    $('.reservation-left-timer').text("("+ runningTimer(1, moment.utc(deviceStatus.currentServerTime)) +")")
                }, 1000);
            });
            mst.callMst('apkPanel', function (cb) {
                var rendered = Mustache.render(cb, {});
                $('.panels-container').append(rendered);
                $('#def-apk').darkTooltip({
                    trigger: 'click',
                    theme: 'light',
                    animation: 'flipIn',
                    gravity: 'north',
                    modal: true,
                    onClose: function () {
                        var apkState = $('#darktooltip-def-apk .upload-btn-text').text();
                        //var apkProgress = $('#darktooltip-def-apk .loadProgress')[0].style.width;
                        if(apkState === 'Upload'){
                            $('.loadProgress').width('0');
                            $('.upload-btn').removeClass('progressStatus');
                            $('.upload-btn-text').text('Upload');
                            $('.apk-view .apkStatus').empty();
                        }/* else {
                            $('#def-apk.apk .apkProgress').width(apkProgress);
                            $('#def-apk.apk .apkStatus').text(apkState);
                        }*/
                    }
                });
            });
            mst.callMst('toolbar', function (cb) {
                var rendered = Mustache.render(cb, {
                    'S7': deviceStatus.model === "S7" || deviceStatus.model === "S7 Active"
                });
                $('.panels-container').prepend(rendered);
                $('.power, .home , .go_back, .recent_apps, .vol_up, .vol_down, .bixby, .rotate').darkTooltip({
                    animation: 'flipIn',
                    gravity: 'west'
                });
            });
        });
    };

    var reservationStatus = function (iframe ,userInfo, userToken) {
        if(userInfo.token) {
            that.params.token = userInfo.token;
            that.params.rId = userInfo.rId;
        }
        that.isDeveloper = userInfo ? userInfo.devRole : false;
        that.params.contentType = "application/json;charset=utf-8";
        rtlApis.rtlApi('GET', that.params, null, 'reservation-service/api/reservations/status=in_progress', function (deviceStatus) {
            if(window.location.hostname === 'localhost' && deviceStatus.status === 401 && deviceStatus.responseText && JSON.parse(deviceStatus.responseText).error === 'Unauthorized'){
                loginView(deviceStatus);
            } else {
                that.endTime = deviceStatus.length > 0 ? moment.utc(deviceStatus[0].endTime) : null;
                if (deviceStatus.length !== 0 && deviceStatus[0].reservationStatus === "in_progress") {
                    if (that.endTime.diff(that.timeNow) > 0) {
                        appView(iframe, userToken ? userToken[0] : userInfo, deviceStatus[0]);
                    } else {
                        platformView(iframe, userToken ? userToken[0] : userInfo, deviceStatus[0]);
                    }
                } else {
                    platformView(iframe, userToken ? userToken[0] : userInfo, deviceStatus[0]);
                }
            }
        });
    };

    var loadHistoryList = function (videoHistoryRes, target, flag) {
        videoHistoryRes.sort(function(a,b){
            return new Date(b.createdDate) - new Date(a.createdDate);
        });
        that.videoHistory = [];
        if (videoHistoryRes.statusText && videoHistoryRes.statusText === "error") {
            console.log('Error : error back from Server');
        }else {
            for (var i = 0; i < videoHistoryRes.length; i++) {
                var stillUtc = moment.utc(videoHistoryRes[i].startTime).toDate();
                var timeDiff = that.timeNow.diff(moment.utc(videoHistoryRes[i].startTime));
                if (moment.duration(timeDiff).days() >  0 && videoHistoryRes[i].isVideoExists || moment.duration(timeDiff).days() === 0) {
                    that.videoHistory.push({
                        idx: i,
                        createdDate: moment.utc(videoHistoryRes[i].startTime).format("MMMM Do YYYY"),
                        age: moment(stillUtc).local().format('h:mm:ss a'),
                        expires: moment(moment(videoHistoryRes[i].startTime).add(7, 'd').format('YYYY/MM/DD HH:mm:mm')).local().fromNow(),
                        videoUrl: videoHistoryRes[i].isVideoExists ? videoHistoryRes[i].videoUrl : null,
                        rId: videoHistoryRes[i].reservationId,
                        isVideoExists: videoHistoryRes[i].isVideoExists,
                        is32bit: navigator.userAgent.indexOf("WOW64") !== -1
                    });
                }
            }
            if(flag) {
                mst.callMst('historyPanel', function (cb) {
                    var rendered = Mustache.render(cb);
                    $(target).append(rendered);
                    mst.callMst('historyItems', function (cb) {
                        var rendered = Mustache.render(cb, {videoHistoryRes: that.videoHistory});
                        $('.listItems').append(rendered);
                    });
                });
            } else {
                mst.callMst('historyItems', function (cb) {
                    $('.videoList, .loader').remove();
                    var rendered = Mustache.render(cb, {videoHistoryRes: that.videoHistory});
                    $('.listItems').append(rendered);
                    that.refreshTrigger = true;
                });
            }
            that.viewTrigger = true;
        }
    };

    var historyPanelView = function (target) {
        var isHistoryPanel = $('.history.panel');
        if(!isHistoryPanel.length && that.viewTrigger) {
            that.viewTrigger = false;
            rtlApis.rtlApi('GET', that.params, null, 'reservation-service/api/reservations/status=complete', function (videoHistoryRes) {
                loadHistoryList(videoHistoryRes, target, 1);
                $(target).on('click','.videoList', function (e) {
                    var $ele = $(this);
                    if(e.target === $(this).find('video')[0]){
                        e.preventDefault();
                        return;
                    }
                    if(!($ele.hasClass('selected'))) {
                        var $sel = $('.selected');
                        if($sel.length > 0) { $sel.find('video')[0].pause();$sel.removeClass('selected'); }
                        $ele.parent().find('.content').hide();
                        $ele.addClass('selected').find('.content').show().css('display', 'flex').animateCss('flipInX');
                    } else if($(e.target).hasClass('clear')){
                        rtlApis.rtlApi('DELETE', that.params, null, 'reservation-service/api/reservations/' + $(this).attr('data-rId') + '/video', function (res) {
                            $ele.animateCss('bounceOut',function () { $ele.remove() });
                        });
                    } else {
                        $ele.removeClass('selected').find('.content').animateCss('flipOutX',function(){ $ele.find('.content').hide() });
                    }
                });
                $(target).on('click','.history .clear-all', function () {
                    var list = $.map($('.videoList'), function(i) { return $(i).attr('data-rId') });
                    rtlApis.rtlApi('DELETE', that.params, null, 'reservation-service/api/reservations/' + list + '/video', function (res) {
                        $('.videoList').animateCss('bounceOut',function () { $('.videoList').remove() });
                    });
                });
                $(target).on('click','.history .refresh', function () {
                    if($('.history').find('.loader').length === 0) {
                        $('.panel-header').append('<div class="loader"></div>');
                    }
                    if(that.refreshTrigger) {
                        that.refreshTrigger = false;
                        rtlApis.rtlApi('GET', that.params, null, 'reservation-service/api/reservations/status=complete', function (videoHistoryRes) {
                            setTimeout(function () {
                                loadHistoryList(videoHistoryRes, target, 0);
                            }, 150);
                        });
                    }
                });
            });
        } else {
            isHistoryPanel.remove();
        }
    };

    //loginView();
    //mainContent.on('click','.login-submit', function () {
    //platformView();
    //});

    mainContent.on('click', '#rtl-android, #rtl-tizen, .icon-loop2', that, function (e) {
        if($(this).hasClass('icon-loop2')){
            // Maybe used in Future
            /*var plats = e.data.rtlState.platforms;
            for (var key in plats) {
                if(plats[key]) {
                    modelsView(key);
                }
            }*/
            e.data.rtlState.reserve = { "models": [], "subModels":[] };
            platformView(e.data.insideIframe, e.data.userInfo);
        } else {
            var selectedPlatform = $(this).attr('id').split('rtl-')[1];
            $('.progressbar-bg li:first-child').addClass('active');
            $('.progressbar li:first-child').addClass('icon-checkmark active');//.text(selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.substr(1));
            if (!$(this).hasClass('greyed')) {
                modelsView(selectedPlatform);
            }
        }
    });

    mainContent.on('click', '#rtl-noteSeries, #rtl-sSeries, #rtl-tabletSeries, #rtl-tizen-phone, #rtl-tv, #rtl-gear, #rtl-family-hub', function () {
        if(!$(this).hasClass('greyed')) {
            $('.progressbar-bg li:eq(1)').addClass('active');
            $('.progressbar li:eq(1)').addClass('icon-checkmark  active'); // Needs later while list get populated
            that.targetDevice = $(this).is("#rtl-noteSeries") || $(this).is("#rtl-sSeries") || $(this).is("#rtl-tabletSeries") ? "android" : "tizen";
            deviceListView($(this).attr('data-model'));
            that.rtlState.reserve.models.push(that.targetDevice);
            that.rtlState.reserve.subModels.push($(this).attr('data-model'));
        }
    });

    mainContent.on('click','.historyBtn',function () {
        $(this).toggleClass('active');
        $(this).hasClass('insideApp') ? historyPanelView('.panels-container') : historyPanelView('.mainBody');
    });

    /***
     * Required for Checkboxes Advance Search
     */
    /*mainContent.on('click', '.device-filters [type="checkbox"]', function () {
        deviceList.List(this.targetDevice ,function (list) {
            // First Argument needs device Type e.g ["Galaxy","family_hub"] pick any one from here
            $.get('uiviews/selectDevice.mst', function(template) {
                var rendered = Mustache.render(template, {"list": [list][0]});
                mainContent.html(rendered);
            });
        });
    });*/

    var adjustPanels = function (context, idx, callback) {
        if ($(context[idx]).length){
            var getContext = $(context[idx])[0].classList[0];
            var ele = $('.' + getContext);
            if (ele.hasClass('active')) {
                ele.removeClass('active');
            }
            $(context[idx]).remove();
            typeof callback === 'function' && callback();
        }
    };

    var viewAvailable = function(callback) {
        $('.full-screen-error').remove();
        var $panels = $('.panel');
        if (win.width() <= 950 && $panels.length > 2) {
            $($panels[2]).animateCss('bounceOutRight', function () {
                adjustPanels($('.panel'), 2, function () {
                    typeof callback === 'function' && callback(2);
                });
            });
        } else if(win.width() <= 750 && $panels.length > 1) {
            $($panels[1]).animateCss('bounceOutRight', function () {
                adjustPanels($('.panel'), 1, function () {
                    typeof callback === 'function' && callback(1);
                });
            });
        } else if(win.width() <= 600 && $panels.length === 1) {
            $panels.animateCss('bounceOutRight', function () {
                adjustPanels($('.panel'), 0, function () {
                    typeof callback === 'function' && callback(0);
                });
            });
        } else if(win.width() <= 305) {
            if($('full-screen-error').length === 0) {
                $('body').append('<div class="full-screen-error"><div><div class="icon-warning alertIe animated infinite flash"></div> Unfortunately<br />App doesn\t support this viewport size.<br />Please Try on bigger screen.</div></div>');
            }
        } else {
            typeof callback === 'function' && callback('reset');
        }
    };

    $('body').on('submit','ins .form-group', function (e) {
        appActions.uploadapk(e);
    });

    mainContent.on('click', 'button.avail-device', function () {
        that.reservebtn = $(this);
        that.reservebtn.addClass('loading');
        var getModel = $(this).attr('data-model');
        var getOs = $(this).attr('data-os');
        var getCarrier = $(this).attr('data-carrier');
        var getCustomeDevice = that.reservebtn.prevUntil(that.reservebtn.parent(), "input" ).val();
        var customeDeviceID = getCustomeDevice !== "" ? getCustomeDevice : "";
        var getTimeSlot = that.reservebtn.prevUntil(that.reservebtn.parent(), "select" ).val();
        cookie.set('lastUsedModal', getModel);
        cookie.set('lastUsedId', getCustomeDevice !== "" || getCustomeDevice !== undefined  ? getCustomeDevice : "");
        rtlApis.rtlApi('POST' ,that.params ,JSON.stringify({"timeSlot":getTimeSlot,"deviceSearchRequest":{ "models":[getModel], "deviceIds":[customeDeviceID],  "osVersions": [getOs], "carriers": [getCarrier]}}), 'reservation-service/api/reservations', function (res) {
            if(res.status === 400){
                that.reservebtn.removeClass('loading');
                if(that.reservebtn.prev().hasClass('error')){
                    that.reservebtn.prevUntil(that.reservebtn.parent(),'.error' ).animateCss('flash');
                } else {
                    that.reservebtn.before('<span class="error animated">' + res.responseJSON.errors[0] + '</span>');
                }
            } else if(res.statusText && res.statusText === "error"){
                that.reservebtn.addClass('loading');
                console.log('Error : error back from Server');
            } else  {
                $('.progressbar li:eq(2)').addClass('icon-checkmark  active').delay(500)
                    .queue(function() {
                        appView(that.insideIframe, that.userInfo, res);
                    });
            }
        });
    });

    win.resize(function(){ viewAvailable() }).resize();

    mainContent.on('click','.panel-buttons li', that, function (evt) {
        var $this = $(this);
        $this.toggleClass('active', !($this.hasClass('active')));
        viewAvailable(function (res) {
            switch($this.attr('class')) {
                case 'logs':
                case 'logs active':
                    var isLogPanel = $('.logs.panel');
                    if(!isLogPanel.length) {
                        mst.callMst('logsPanel', function (cb) {
                            var rendered = Mustache.render(cb, {});
                            $('.panels-container').append(rendered);
                            $('.logs-filter').change(function () {
                                var target = $("select option:selected").val().toLowerCase();
                                appActions.logs("cmdStartLogs", target);
                            }).change();
                            $('.save-logs').click(function () {
                                that.params.rId = that.rId;
                                rtlApis.rtlApi('GET', that.params, null, 'ffmpeg-service/api/log/'+ that.rId, function (res) {
                                    if(res.status === 200) {
                                        $.fileDownload(res.responseText);
                                    } else {
                                        console.log('File not exit on server!!!!');
                                    }
                                });
                            });
                            $('.clear-logs').click(function () {
                                appActions.cmds("cmdClearLogs",null);
                            });
                            $('.search-container .icon-search').click(function () {
                                var search = $.trim($('#myTags').val());
                                if(search.length > 0) {
                                    appActions.cmds("cmdFilterLogs", search);
                                }
                            });
                            $("input#myTags").keypress(function(event) {
                                if (event.which == 13) {
                                    event.preventDefault();
                                    $('.search-container .icon-search').trigger('click');
                                }
                            });
                        });
                    } else {
                        var target = $(".logs-filter option:selected").val().toLowerCase();
                        isLogPanel.remove();
                        appActions.logs("cmdStopLogs", target);
                    }
                    break;
                case 'Wipe':
                case 'Wipe active':
                    appActions.Wipe();
                    break;
                case 'screenshot':
                case 'screenshot active':
                    var isScreenshotPanel = $('.screenshot.panel');
                    if(!isScreenshotPanel.length) {
                        mst.callMst('screenshotPanel', function (cb) {
                            var rendered = Mustache.render(cb, {});
                            $('.panels-container').append(rendered);
                            appActions.takeScreenshot();

                            $("#btn-Preview-Image").on('click', function () {
                                $("#previewImage").empty();
                                appActions.takeScreenshot();
                            });

                            $("#btn-Clear-Screenshot").on('click', function () {
                                $("#previewImage").empty();
                            });

                            $("#btn-Convert-Html2Image").on('click', function () {
                                appActions.downloadScreenshot();
                            });
                        });
                    } else {
                        isScreenshotPanel.remove();
                    }
                    break;
                default:
                    console.log('Nothing happens reached default');
            }
        });
    });

    mainContent.on('click','.toolbar li', function () {
        $(this).toggleClass('active');
        switch($(this).attr('class')) {
            case 'power':
            case 'power active':
                appActions.toolAction('POWER', 'tracker');
                break;
            case 'home':
            case 'home active':
                appActions.toolAction('HOME', 'tracker');
                break;
            case 'go_back':
            case 'go_back active':
                appActions.toolAction('BACK', 'tracker');
                break;
            case 'recent_apps':
            case 'recent_apps active':
                appActions.toolAction('RECENT_APPS', 'tracker');
                break;
            case 'vol_up':
            case 'vol_up active':
                appActions.toolAction('VOL_UP', 'tracker');
                break;
            case 'vol_down':
            case 'vol_down active':
                appActions.toolAction('VOL_DOWN', 'tracker');
                break;
            case 'bixby':
            case 'bixby active':
                appActions.toolAction('BIXBY', 'tracker');
                break;
            case 'swipe':
            case 'swipe active':
                var isSwipeToolbar = $('.toolbar.swipe');
                if(!isSwipeToolbar.length) {
                    mst.callMst('swipeToolbar', function (cb) {
                        var rendered = Mustache.render(cb, {});
                        $('.panels-container').prepend(rendered)
                        $('.toolbar.swipe').css('top', ($('li.swipe').position().top - 2) + 'px');
                    });
                } else {
                    isSwipeToolbar.remove();
                }
                break;
            case 'swipe_top':
            case 'swipe_top active':
                appActions.toolAction('SWIPE_TOP', 'tracker');
                break;
            case 'swipe_left':
            case 'swipe_left active':
                appActions.toolAction('SWIPE_LEFT', 'tracker');
                break;
            case 'swipe_bottom':
            case 'swipe_bottom active':
                appActions.toolAction('SWIPE_BOTTOM', 'tracker');
                break;
            case 'swipe_right':
            case 'swipe_right active':
                appActions.toolAction('SWIPE_RIGHT', 'tracker');
                break;
            default:
                console.log('Nothing happens reached default');
        }
    });

    mainContent.on('mouseleave', '.toolbar.swipe', function (e) {
        $('.toolbar.swipe').remove();
    });

    mainContent.on('mouseenter', '.device-panel', function (e) {
        $('.toolbar.swipe').remove();
    });

    var showFilterError = function ($ele, msg) {
        $('.loader').remove();
        $ele.find('.available-devices').empty();
        if (!$('.noData').length) {
            $ele.append('<div class="noData">' + msg + '</div>');
        }
    };

    var renderList = function(search, advanceFilter){
        //search.series = ["RF"];
        var platform = search.platforms.android ? "android" : "tizen";
        var $list = $('.device-results');
        if($list.find('.loader').length === 0) {
            $list.find('h3').append('<div class="loader"></div>');
        }
        if(!search.platforms.android){
            showFilterError($list, 'This Platform is not supported yet.\nWill be coming soon.');
        } else if (advanceFilter ? search.series.length && search.osVersions.length && search.carriers.length : search.series.length) {
            rtlApis.rtlApi('POST', that.params, JSON.stringify({
                platforms: [platform],
                series: search.series,
                osVersions: search.osVersions,
                carriers: search.carriers
            }), 'device-service/api/search', function (list) {
                if (list.statusText && list.statusText === "error") {
                    console.log('Error : error back from Server');
                } else {
                    $('.loader').remove();
                    var listObj = [];
                    if (search.series.length > 0) {
                        $('.noData').remove();
                        for (var y = 0; y < search.series.length; y++) {
                            for (var i = 0; i < list.length; i++) {
                                if ((list[i].model).indexOf(that.rtlState.series[y]) === 0) {
                                    listObj.push({
                                        'idx': i,
                                        'device': list[i].model,
                                        'product': list[i].product,
                                        'carrier': list[i].carrier,
                                        'osVersion': list[i].osVersion,
                                        'imageUrl': 'https://s3.amazonaws.com/rtlassets/' + (list[i].product).toLowerCase() + '/' + encodeURIComponent((list[i].model).toLowerCase()) + '.png',
                                        'deviceId': list[i] === cookie.get('lastUsedModal') && cookie.get('lastUsedId') !== 'undefined' ? cookie.get('lastUsedId') : '',
                                        'active': list[i].modal === "S7 Active" || list[i].modal === "S8 Active" || list[i].modal === "S9 Active" ? "Yes" : "No"
                                    });
                                }
                            }
                        }
                        if (list.status) {
                            $list.find('h3').append('<span class="error">Error : ' + list.responseJSON.message + '</span>');
                        } else {
                            /* Distinct Result Set */
                            var obj = {};
                            for ( var i=0, len=listObj.length; i < len; i++ ) {
                                for(key in obj){
                                    if(obj[key].device === listObj[i].device && obj[key].osVersion !== listObj[i].osVersion){
                                        obj[listObj[i]['device'] + obj[key].idx] = obj[key];
                                    }
                                }
                                obj[listObj[i]['device']] = listObj[i];
                            }
                            listObj = [];
                            for ( var key in obj ) {
                                listObj.push(obj[key]);
                            }

                            /* Sorted Result Set */
                            listObj.sort(function(a, b) {
                                return b.device === a.device ? parseFloat(b.osVersion) > parseFloat(a.osVersion) : b.device > a.device;
                            });

                            if (listObj.length !== 0) {
                                mst.callMst('deviceList', function (cb) {
                                    var rendered = Mustache.render(cb, {
                                        "list": listObj,
                                        'role': that.isDeveloper === true
                                    });
                                    $list.find('.available-devices').html(rendered);
                                });
                            } else {
                                showFilterError($list, 'No matching devices found.\nTry changing some filters to see more devices.');
                            }
                        }
                    }
                }
            });
        } else {
            showFilterError($list, 'No matching devices found.\nTry changing some filters to see more devices.');
        }
    };


    var loadSubFilters = function (i, subFilters, platform, filter) {
        if(i<subFilters.length){
            rtlApis.rtlApi('GET', that.params, null, 'device-service/api/platforms/' + platform + '/' + subFilters[i], function (list) {
                var viewList = [];
                for (var idx in list) {
                    viewList.push({'idx': idx, 'type': subFilters[i], 'val': list[idx], 'checked' : true, 'disabled' : false});
                    if(subFilters[i] === "series") {
                        for (var checked in filter.series) {
                            viewList[idx].checked = filter.series[checked] === viewList[idx].val;
                        }
                    } else if(subFilters[i] === "carriers"){
                        that.rtlState.carriers.push(list[idx]);
                    } else if(subFilters[i] === "os-versions"){
                        that.rtlState.osVersions.push(list[idx]);
                    }
                }
                mst.callMst('subFilter', function (cb) {
                    var rendered = Mustache.render(cb,{
                        'list': viewList,
                        'series': subFilters[i] === "series"
                    });
                    $('.android-'+subFilters[i]).html(rendered);
                    $('.'+ subFilters[i] +'-loader').remove();
                    i++;
                    loadSubFilters(i, subFilters, platform, filter);
                });
            });
            $('.android-'+subFilters[i]).prev().append('<div class="'+ subFilters[i] +'-loader"></div>');
        }
    };

    var changeStatus = function (filter, status, name, id, cb) {
        if(id.startsWith("os")){
            status ? filter.osVersions.push(name) : filter.osVersions.splice(filter.osVersions.indexOf(name), 1);
        } else if(id.startsWith("series")){
            status ? filter.series.push(name) : filter.series.splice(filter.series.indexOf(name), 1);
        } else if(id.startsWith("carriers")){
            status ? filter.carriers.push(name) : filter.carriers.splice(filter.carriers.indexOf(name), 1);
        }
        cb(filter);
    };

    var renderFilter = function(filter){
        var platform = filter.platforms.android ? "android" : "tizen";
        mst.callMst('filters', function (cb) {
            var $filters = $('.filters-breakdown');
            var rendered = Mustache.render(cb, {
                'android': filter.platforms.android,
                'tizen': filter.platforms.tizen
            });
            $filters.html(rendered);
            var subFilters = ['series','carriers','os-versions'];
            loadSubFilters(0, subFilters, platform, filter);
            $filters.find('[type="radio"]').change(function() {
                switch($(this).attr('id')) {
                    case "tizen":
                        $('.slideRight').removeClass('slideRight');
                        $('.filters-breakdown > li:not(:first-child)').addClass('slideLeft');
                        filter.platforms = { android: false, tizen : true };
                        break;
                    case "android":
                        $('.slideLeft').removeClass('slideLeft');
                        $('.filters-breakdown > li:not(:first-child)').addClass('slideRight');
                        filter.platforms = { android: true, tizen : false };
                        break;
                }
                renderList(filter, 0);
            });
            $filters.on('change', '[type="checkbox"]', function() {
                changeStatus(filter, this.checked, $(this).attr('name'), $(this).attr('id'), function (newFilter) {
                    renderList(newFilter, 1);
                });
            });
        });
    };

    return {
        reservationStatus: reservationStatus,
        appView: appView
    }

});
