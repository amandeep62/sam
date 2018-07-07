"use strict";define(["jquery","animateCss","moment","sockjs","stomp","cookie","rtlApis","endPoint"],function(g,e,h,r,t,s,f,i){var a=g(".container"),v={jc:{type:null,payload:null,screenCoordinates:{x:null,y:null},resolution:{height:null,width:null}},mouseState:null,devicefocus:!1,hold:!1,drag:!1,mouseReleasedTime:0,longPress:!1,stompClient:null,setConnected:!1,params:{processData:!0,contentType:"application/json;charset=utf-8",crossDomain:!0,enctype:!1,token:null,rId:null},getCanvas:null,byteLength:0,showingFrameSn:0,img:null,contentType:"image/png",blob:null,blobUrl:null,userMsg:{cls:"upload-success",msg:"Upload successful"},dId:null,rId:null};v.currentTimeStamp=h.utc().valueOf(),v.analyticData=[],v.socketNext=null,v.naturalHgt=0,v.naturalWth=0;var l=function(e){y("captureDispatched",""),v.byteLength+=e.body.length,v.showingFrameSn=e.headers.sn,v.imagePayload=e.body;var t=h.duration(e.headers.ts-v.currentTimeStamp);g("#bpsCount").text(v.byteLength),v.byteLength=0,g("#showingFrameSn").text(v.showingFrameSn),g("#frameTS").text(t.milliseconds()+"ms"),v.img=new Image,v.img.src="data:image/jpeg;base64,"+v.imagePayload,v.img.onload=function(){v.naturalHgt=this.height,v.naturalWth=this.width,v.jc.resolution.height=this.height,v.jc.resolution.width=this.width,v.img=null,URL.revokeObjectURL(v.blobUrl)},v.blob=b(v.imagePayload,v.contentType),v.blobUrl=URL.createObjectURL(v.blob),g(".loader").remove();var s=g("#bitmapdata");s.attr("src",v.blobUrl),v.analyticData.push({deviceId:v.dId,eventType:"remoteDesktop",frameNumber:parseInt(v.showingFrameSn),latencyInMilliSec:t.milliseconds(),reservationId:v.rId}),5e3<v.analyticData.length&&(f.rtlApi("POST",v.params,JSON.stringify(v.analyticData),"reservation-service/api/analytics",function(e){}),v.analyticData=[]);var a,o,n,r,i,l=g("#phoneBody"),c=l.width(),d=l.height(),p=s.prop("naturalWidth"),u=s.prop("naturalHeight"),m=(a=p,o=u,n=c-60,r=d-100,i=Math.min(n/a,r/o),{width:a*i,height:o*i});s.css(m)};a.on("mouseenter mouseleave mouseup mousemove mousedown dragstart","#bitmapdata",function(e,t){var s;switch(e.type){case"mousedown":v.mouseState="down",setTimeout(function(){v.hold=!0},10),s={resolution:v.jc.resolution,screenCoordinates:{x:e.offsetX*v.jc.resolution.height/this.height+2,y:e.offsetY*v.jc.resolution.width/this.width-2},type:"freeDraw",payload:{state:"start"}},v.stompClient.send("/socket/rtl/ui/device/tracker/"+v.dId,{"reservation-id":v.rId},JSON.stringify(s));break;case"mousemove":v.hold&&(s={resolution:v.jc.resolution,screenCoordinates:{x:e.offsetX*v.jc.resolution.height/this.height+2,y:e.offsetY*v.jc.resolution.width/this.width-2},type:"freeDraw",payload:{state:"on"}},v.stompClient.send("/socket/rtl/ui/device/tracker/"+v.dId,{"reservation-id":v.rId},JSON.stringify(s)));break;case"mouseup":"down"===v.mouseState&&(v.mouseState="up",v.hold=!1,s={resolution:v.jc.resolution,screenCoordinates:{x:(t?t.offsetDataX:e.offsetX)*v.jc.resolution.height/this.height+2,y:(t?t.offsetDataY:e.offsetY)*v.jc.resolution.width/this.width-2},type:"freeDraw",payload:{state:"end"}},v.stompClient.send("/socket/rtl/ui/device/tracker/"+v.dId,{"reservation-id":v.rId},JSON.stringify(s)));break;case"mouseleave":v.hold=!1,v.devicefocus=!1,g(this).trigger("mouseup",[{offsetDataX:e.offsetX,offsetDataY:e.offsetY}]);break;case"mouseenter":v.devicefocus=!0,g(document.activeElement).trigger("blur");break;case"dragstart":return!1}}),window.addEventListener("keyup",function(e){if(v.setConnected&&16!==e.keyCode&&v.devicefocus){var t=JSON.stringify({type:"KEYCODE",payload:{key:e.keyCode.toString(),shiftKey:e.shiftKey}});v.stompClient.send("/socket/rtl/ui/device/tracker/"+v.dId,{"reservation-id":v.rId},t)}});var y=function(e,t){if("cmdScreenshot"===e){var s=JSON.stringify({type:e,payload:t});v.stompClient.send("/socket/rtl/ui/device/control/"+v.dId,{},s)}else if("captureDispatched"!==e){s=JSON.stringify({type:e,payload:t});v.stompClient.send("/socket/rtl/ui/device/control/"+v.dId,{},s),f.rtlApi("DELETE",v.params,null,"ffmpeg-service/api/log/"+v.rId,function(e){g(".logs.panel .panel-view").text("")})}},o=function(){v.jc.type="clean-up",v.jc.payload="device";var e=JSON.stringify(v.jc);v.stompClient.send("/socket/rtl/ui/device/screen/"+v.dId,{"reservation-id":v.rId},e)},n=function(e,t){g(".apkStatus").html('<span class="upload-error">'+t+"</span>").animateCss("flash")},c=function(e){var t=g("ins .apk-view"),s=t.find(".apkStatus"),a=t.find(".loadProgress"),o=t.find(".upload-btn"),n=t.find(".upload-btn-text");switch(e){case"uploadStarted":a.width("10%"),v.userMsg={cls:"progressStatus",msg:"Uploading started"};break;case"uploadCompleted":a.width("30%"),v.userMsg={cls:"progressStatus",msg:"APK Uploaded"};break;case"downloadStarted":a.width("40%"),v.userMsg={cls:"progressStatus",msg:"APK Download Started"};break;case"downloadCompleted":a.width("60%"),v.userMsg={cls:"progressStatus",msg:"APK installation started"};break;case"downloadFailed":a.width("70%"),v.userMsg={cls:"progressStatus error",msg:"APK Download Failed"};break;case"installFailed":a.width("70%"),v.userMsg={cls:"progressStatus error",msg:"APK Installation Error"},d();break;case"installCompleted":a.width("100%"),v.userMsg={cls:"progressStatus",msg:"Installation Done"},s.html('<span class="upload-success"><span class="icon-checkmark"></span> Successfully Installed</span>'),d();break;default:console.log("Nothing happens reached default on Upload Message")}s.find("span").hasClass("upload-success")?g(".upload-success").animateCss("flash"):s.find("span").hasClass("upload-error")?g(".upload-error").animateCss("flash"):(o.removeClass("error").addClass(v.userMsg.cls),n.text(v.userMsg.msg))},d=function(){g("#darktooltip-def-apk, .darktooltip-modal-layer").fadeOut("slow",function(){setTimeout(function(){g(".loadProgress").width("0"),g(".upload-btn").removeClass("progressStatus"),g(".upload-btn-text").text("Upload"),g(".apk-view .apkStatus").empty()},1e3)})},b=function(e,t,s){t=t||"",s=s||512;for(var a=atob(e),o=[],n=0;n<a.length;n+=s){for(var r=a.slice(n,n+s),i=new Array(r.length),l=0;l<r.length;l++)i[l]=r.charCodeAt(l);var c=new Uint8Array(i);o.push(c)}return new Blob(o,{type:t})};return{connect:function(e,t,s){v.dId=e,v.rId=t,v.params.rId=t,v.params.token=s,console.log("Started WS connect");var a={"reservation-id":v.rId},o=i.serverLb+"/stream-service/web-socket",n=new r("https://"+o);v.stompClient=Stomp.over(n),v.stompClient.debug=null,v.stompClient.heartbeat.outgoing=3e4,v.stompClient.heartbeat.incoming=3e4,v.stompClient.connect(a,function(e){v.setConnected=!0,g("#showBps").html('Bps: <span id="bpsCount"></span><br />Frame D: <span id="dispatchCount"></span><br />UI Frame: <span id="showingFrameSn"></span><br />Frame TS: <span id="frameTS"></span><br />Remote TS: <span id="remoteTS"></span>'),v.stompClient.subscribe("/topic/response/rtl/ui/device/screen/"+v.dId,function(e){l(e)}),v.stompClient.subscribe("/topic/response/rtl/ui/device/logs/"+v.dId,function(e){var t,s,a,o,n;t=e.body,a=5e3,o=g(".logs .panel-view"),(n=JSON.parse(t).payload+"\n").length>=a?s=n.substring(n.length-a,n.length):(s=o.text()+n).length>=a&&(s=s.substring(Math.min(s.length-a,a),s.length)),o.text(s)}),v.stompClient.subscribe("/topic/response/rtl/ui/device/control/"+v.dId,function(e){var t=JSON.parse(e.body);switch(g("#dispatchCount").text(t.sn),t.type){case"msgApkDownload":c(t.status);break;case"remoteInjectionFeedback":var s=h.duration(t.ts-v.currentTimeStamp);g("#remoteTS").text(s.milliseconds()+"ms"),v.analyticData.push({deviceId:v.dId,eventType:"remoteInjection",frameNumber:parseInt(v.showingFrameSn),latencyInMilliSec:s.milliseconds(),reservationId:v.rId});break;case"msgScreenshot":var a=b(t.payload,"image/png"),o=URL.createObjectURL(a);g("#previewImage").html("<img src="+o+" />")}}),function(){v.jc.type="RemoteDesktop";var e=JSON.stringify(v.jc);console.log(e),v.stompClient.send("/socket/rtl/ui/device/screen/"+v.dId,{"reservation-id":v.rId},e)}()})},Wipe:o,logs:function(e,t){y("cmdClearLogs",null),y(e,t),g(".logs > .panel-view").empty(),v.jc.type="logLevel",v.jc.payload=t;var s=JSON.stringify(v.jc);console.log(s),v.stompClient.send("/socket/rtl/ui/device/logs/"+v.dId,{"reservation-id":v.rId},s)},cmds:y,takeScreenshot:function(){y("cmdScreenshot",null);var e=v.imagePayload,t=b(e,"image/png"),s=URL.createObjectURL(t);g("#previewImage").append("<img src="+s+" />")},downloadScreenshot:function(){g("#btn-Convert-Html2Image").attr("download","remote_desktop_screenshot.png").attr("href",g("#previewImage >img").attr("src"))},uploadapk:function(e){e.preventDefault();var t=new FormData,s=g("ins .apkUpload"),a=g("ins .apk-view > .apkStatus");if(1<=s[0].files.length){if(0===s[0].files[0].size)return void n(a,"Invalid APK");c("uploadStarted"),g(".apkStatus").empty(),t.append("file",s[0].files[0]);var o=v.params;o.processData=!1,o.contentType=!1,o.enctype="multipart/form-dat;charset=UTF-8",f.rtlApi("POST",o,t,"upload-service/api/files",function(e){if(e.statusText&&"error"===e.statusText)console.log("Error : error back from Server");else if(void 0!==e.files[0].key){c("uploadCompleted"),v.jc.type="install",v.jc.payload=void 0!==e.files[0].url?e.files[0].url:"";var t=JSON.stringify(v.jc);v.stompClient.send("/socket/rtl/ui/device/screen/"+v.dId,{},t)}})}else n(a,"Please Choose File First")},toolAction:function(e,t){var s;if(v.jc.type=e,v.jc.payload=e,new RegExp("^SWIPE","i").test(e)){var a=e.replace("SWIPE_","");switch(v.jc.screenCoordinates.x=v.naturalWth/2,v.jc.screenCoordinates.y=v.naturalHgt/2,a){case"TOP":v.jc.screenCoordinates.x1=v.naturalWth/2,v.jc.screenCoordinates.y1=0;break;case"LEFT":v.jc.screenCoordinates.x1=0,v.jc.screenCoordinates.y1=v.naturalHgt/2;break;case"BOTTOM":v.jc.screenCoordinates.x1=v.naturalWth/2,v.jc.screenCoordinates.y1=v.naturalHgt;break;case"RIGHT":v.jc.screenCoordinates.x1=v.naturalWth,v.jc.screenCoordinates.y1=v.naturalHgt/2}s=JSON.stringify({resolution:v.jc.resolution,screenCoordinates:v.jc.screenCoordinates,type:v.jc.type})}else s=JSON.stringify({type:"TOOLBAR",payload:{key:e}});v.stompClient.send("/socket/rtl/ui/device/"+t+"/"+v.dId,{},s)},disconnect:function(t,s){v.jc.type="disconnect",v.jc.payload="";var e=JSON.stringify(v.jc);null!==v.stompClient&&(v.stompClient.send("/socket/rtl/ui/device/screen/"+v.dId,{"reservation-id":v.rId},e),v.stompClient.send("/socket/rtl/ui/device/logs/"+v.dId,{"reservation-id":v.rId},e),o(),v.stompClient.disconnect()),v.setConnected=!1,v.rId?f.rtlApi("GET",v.params,null,"reservation-service/api/reservations/"+v.rId+"/release",function(e){console.log("reservationData "+JSON.stringify(e)),"complete"==e.reservationStatus&&(console.log("reservation status  is complete"),s("logout"!==t||e.reservationStatus))}):s("complete")}}});