"use strict";define(["jquery"],function(s){var u={};return{callMst:function(t,i){var n,e;u[t]?i(u[t]):(n="uiviews/"+t+".mst",e=i,s.get(n,function(t){u[n.split("/")[1].split(".")[0]]=t,e(t)}))}}});