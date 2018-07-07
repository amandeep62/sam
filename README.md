## Cloud Device Farm Web Application - API's and Websockets Documentation ##

     Dev-UI endpoint:  https://dev-ui.seacvl.com
     Dev endpoint:  https://dev.seacvl.com
     QA endpoint:  https://qa.seacvl.com

### 1. API: getAllReservationsByStatus ###
**Request**:- (**GET**)  /api/reservations/status={reservationStatus}
* Headers: Token
* {reservationStatus} -- scheduled OR complete OR in_progress OR cancelled

 **Response**: (Status 200) List of reserved devices

   >[
    {
      "createdBy": "string",
      "createdDate": "2018-03-06T17:40:49.954Z",
      "deviceId": "string",
      "endTime": "2018-03-06T17:40:49.954Z",
      "labId": "string",
      "logFileUrl": "string",
      "model": "string",
      "pairingDeviceId": "string",
      "reservationId": "string",
      "reservationStatus": "scheduled",
      "startTime": "2018-03-06T17:40:49.954Z",
      "subModel": "string",
      "timeSlot": 0,
      "updatedBy": "string",
      "updatedDate": "2018-03-06T17:40:49.954Z",
      "version": 0,
      "videoUrl": "string"
    }
  ]


### 2. API: getPlatforms ###
**Request**:- (**GET**) /api/platforms
 * Headers: Token

**Response**: (Status 200) List of available platforms

   > ["ANDROID"]


### 3. API: getSubModels ###
**Request**:- (**GET**) /api/sub-models
* Headers: Token

**Response**: (Status 200) List of available sub-models

> ["S8","Note8"]


### 4. API: getSubModelsByModelNumber ###
**Request**:- (**GET**)  /api/models/{modelNumber}/sub-models
* Headers: Token
* {modelNumber}: Galaxy

**Response**: (Status 200)

   > ["S8","Note8"]


### 5. API: addReservation ###
**Request**:- (**POST**) /api/reservations
* Headers: Token
* Data:  {"timeSlot":0,"deviceSearchRequest":{ "models": ["string"],"subModels":["string"], "deviceIds":["string"]}


**Response**: (Status 200)

   > {
       "createdBy": "string",
       "createdDate": "2018-03-06T21:42:21.540Z",
       "deviceId": "string",
       "endTime": "2018-03-06T21:42:21.540Z",
       "labId": "string",
       "logFileUrl": "string",
       "model": "string",
       "pairingDeviceId": "string",
       "reservationId": "string",
       "reservationStatus": "scheduled",
       "startTime": "2018-03-06T21:42:21.540Z",
       "subModel": "string",
       "timeSlot": 0,
       "updatedBy": "string",
       "updatedDate": "2018-03-06T21:42:21.540Z",
       "version": 0,
       "videoUrl": "string"
     }


### 6. Websocket: Initaliaze websocket Connection ###
**Request**:- (**GET**) http://dev-ui.seacvl.com/stream-service/web-socket/


**Response**: (Status 200)

   > {"entropy":716132267,"origins":["*:*"],"cookie_needed":true,"websocket":true}
     }

### 7. Subscribe to destination -- "Screen" ###

* destination:-  /topic/response/rtl/ui/device/screen/
* callback: imageData

### 8. Subscribe to destination -- "Logs" ###

* destination:-  /topic/response/rtl/ui/device/logs/
* callback: logsData

### 9. Stomp send message for Remote Desktop ###
* destination:-  '/socket/rtl/ui/device/screen/' + deviceId
* headers:- {"reservation-id": cookie.get('rId')}
* body:- {"type": "RemoteDesktop", "payload": null}
* callback: imageData

### 10. Stomp send message for Remote Injection ###
* destination:-  '/socket/rtl/ui/device/tracker/'+deviceId
* headers:- {"reservation-id": cookie.get('rId')}
* body:- {"type" : "Single Click|Drag|Swipe|Long Click","x": "","y": "","x1": "", "y1": "","payload": null,"height":"", "witdh":""}
* callback: imageData


### 11. Stomp send message for Logs ###
* destination:-  '/socket/rtl/ui/device/logs/' + deviceID
* body:- {"type" : "logLevel","payload": "verbose"}
* callback: imageData

### 12. Stomp send message for Logs ###
* destination:-  '/socket/rtl/ui/device/logs/' + deviceID
* body:- {"type" : "logLevel","payload": "verbose"}
* callback: imageData

### 13. API: Upload APK ###
**Request**:- (**POST**) upload-service/api/files
* Headers: Token
* Data:  {file}


**Response**: (Status 200)

   > {"fileId":"5a9f9d50bfe523000c631372","createdDate":{"hour":8,"minute":5,"second":36,"nano":568000000,"dayOfYear":66,"monthValue":3,"year":2018,"month":"MARCH","dayOfMonth":7,"dayOfWeek":"WEDNESDAY","chronology":{"id":"ISO","calendarType":"iso8601"}},"updatedDate":{"hour":8,"minute":5,"second":36,"nano":568000000,"dayOfYear":66,"monthValue":3,"year":2018,"month":"MARCH","dayOfMonth":7,"dayOfWeek":"WEDNESDAY","chronology":{"id":"ISO","calendarType":"iso8601"}},"createdBy":"saloni","updatedBy":"saloni","version":0,"files":[{"key":"1520409935_caller.apk","url":"https://samsung-haystack-upload.s3.amazonaws.com/1520409935_caller.apk?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20180307T080536Z&X-Amz-SignedHeaders=host&X-Amz-Expires=900&X-Amz-Credential=AKIAJTX2UOXCB6UUEOAQ%2F20180307%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=7aba49ad9eec0a5699bf20ad5223d85458913a093db2363659372afb70514822"}]}



### 14. Stomp send message for Upload APK ###
* destination:-  '/socket/rtl/ui/device/logs/' + deviceID
* body:- {"type" : "install","payload": res.files[0].url}
* callback: logData


### 15. Stomp send message for Clean up ###
* destination:-  '/socket/rtl/ui/device/screen/' + deviceID
* body:- {"type" : "clean-up","payload": "device"}
* callback: logData

### 16. Stomp send message for Disconnect ###
* destination:-  '/socket/rtl/ui/device/screen/' + deviceID
* destination:-  '/socket/rtl/ui/device/logs/' + deviceID
* body:- {"type" : "disconnect","payload": ""}


### 17. API: releaseReservation ###
**Request**:- (**GET**) /api/reservations/{reservationId}/release
* Headers: Token


**Response**: (Status 200)

   >{
      "createdBy": "string",
      "createdDate": "2018-03-07T08:20:32.694Z",
      "deviceId": "string",
      "endTime": "2018-03-07T08:20:32.694Z",
      "labId": "string",
      "logFileUrl": "string",
      "model": "string",
      "pairingDeviceId": "string",
      "reservationId": "string",
      "reservationStatus": "scheduled",
      "startTime": "2018-03-07T08:20:32.694Z",
      "subModel": "string",
      "timeSlot": 0,
      "updatedBy": "string",
      "updatedDate": "2018-03-07T08:20:32.694Z",
      "version": 0,
      "videoUrl": "string"
    }

### 18. Stomp send message for Power Button ###
* destination:-  '/socket/rtl/ui/device/tracker/'+deviceId
* body:- {"type" : "KEYCODE_POWER_BUTTON","payload": "KEYCODE_POWER_BUTTON"}
* callback: imageData

### 19. Stomp send message for Home Button ###
* destination:-  '/socket/rtl/ui/device/tracker/'+deviceId
* body:- {"type" : "KEYCODE_HOME_BUTTON","payload": "KEYCODE_HOME_BUTTON"}
* callback: imageData

### 20. Stomp send message for Back Button ###
* destination:-  '/socket/rtl/ui/device/tracker/'+deviceId
* body:- {"type" : "KEYCODE_BACK_BUTTON","payload": "KEYCODE_BACK_BUTTON"}
* callback: imageData

### 21. Stomp send message for App Recent List Button ###
* destination:-  '/socket/rtl/ui/device/tracker/'+deviceId
* body:- {"type" : "KEYCODE_APP_RECENT_LIST","payload": "KEYCODE_APP_RECENT_LIST"}
* callback: imageData

### 22. Stomp send message for Volume UP Button ###
* destination:-  '/socket/rtl/ui/device/tracker/'+deviceId
* body:- {"type" : "KEYCODE_VOLUME_UP","payload": "KEYCODE_VOLUME_UP"}
* callback: imageData

### 23. Stomp send message for Volume DOWN Button ###
* destination:-  '/socket/rtl/ui/device/tracker/'+deviceId
* body:- {"type" : "KEYCODE_VOLUME_DOWN","payload": "KEYCODE_VOLUME_DOWN"}
* callback: imageData

### 24. Stomp send message for Swipe Top Button ###
* destination:-  '/socket/rtl/ui/device/tracker/'+deviceId
* body:- {"type" : "KEYCODE_SWIPE_TOP","payload": "KEYCODE_SWIPE_TOP","x": "","y":"","x":"","y1": ""}
* callback: imageData

### 25. Stomp send message for Swipe Left Button ###
* destination:-  '/socket/rtl/ui/device/tracker/'+deviceId
* body:- {"type" : "KEYCODE_SWIPE_LEFT","payload": "KEYCODE_SWIPE_LEFT","x": "","y":"","x":"","y1": ""}
* callback: imageData

### 26. Stomp send message for Swipe Bottom Button ###
* destination:-  '/socket/rtl/ui/device/tracker/'+deviceId
* body:- {"type" : "KEYCODE_SWIPE_BOTTOM","payload": "KEYCODE_SWIPE_BOTTOM","x": "","y":"","x":"","y1": ""}
* callback: imageData

### 27. Stomp send message for Swipe Right Button ###
* destination:-  '/socket/rtl/ui/device/tracker/'+deviceId
* body:- {"type" : "KEYCODE_SWIPE_RIGHT","payload": "KEYCODE_SWIPE_RIGHT","x": "","y":"","x":"","y1": ""}
* callback: imageData

## Run UI project Locally ##

* For localhost setup install one you prefer.
* My preference NODE. Install Node

* Install Postman
* Get Token via using API call -> https://{{hostname}}/auth/realms/haystack/protocol/openid-connect/token
* Copy "access_token" from above API to mock/userToken.json -> "token"

* Go to config/uiconfig.js
* Uncomment line under "//Hard Coded for localhost testing"
* Comment all above function under requirejs().

* Run "npm install http-server -g" on console.
* Go the project root dir and run "http-server -s -o" on console.
* Application started ('_')

