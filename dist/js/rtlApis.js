"use strict";define(["jquery","cookie","endPoint"],function(c,e,r){var a=function(e,n){return e==="ffmpeg-service/api/log/"+n?r.baseUrl+"/ffmpeg-service/api/log/"+n:r.baseUrl+"/"+e};return{rtlApi:function(n,r,e,t,o){c.ajax({type:n,url:a(t,r.rId),processData:r.processData,data:e,dataType:"json",contentType:r.contentType,crossDomain:r.crossDomain,enctype:r.enctype,cache:!1,beforeSend:function(e){e.withCredentials=!0,e.setRequestHeader("Authorization","bearer "+r.token)},success:function(e){o(e)},error:function(e){o(e),"DELETE"!==n&&console.log("Error :"+a(t))}})}}});