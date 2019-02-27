/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

 // Initialize and add the map
 var global_position = {
   lat: 39.739236,
   lng: -104.990251
 };
 var marker;
 var map;
 var geocoder;
 var infowindow;

 // ========================== variable for wildfire area ========================

 var intensity;                   // intensity of wildfire in acre
 var circle;                      // the circle to draw the area of wildfire
 
 // ========================== variable for water body ===========================
 var waterbody;                   // All information of every waterbody
 var waterbodyMarker;             // The marker for waterbody
 var toWaterLine;                 // The line from wildfire center to the closest waterbody
 var lineSymbol;                  // The icon for create dashed line
 var watericon;

 function initMap() {
   readJson();
   map = new google.maps.Map(
     document.getElementById('map'), {zoom: 4, center: global_position});

   geocoder = new google.maps.Geocoder;
   infowindow = new google.maps.InfoWindow;

   google.maps.event.addListener(map, 'click', function(event) {
     hideIntroMessage()
     global_position= {lat: event.latLng.lat(), lng: event.latLng.lng()};
     showLatLng();
     geocodeLatLng(geocoder, map, infowindow);
   });
 }

 function placeMarker(location) {
   if (marker == undefined){
     marker = new google.maps.Marker({
   	    position: location,
   	    map: map,
   	    animation: google.maps.Animation.DROP,
   	});
   }
   else{
      marker.setPosition(location);
   }
   map.setCenter(location);
 }

 // to draw the area of the wildfire
 function drawCircle(){
   radius_m = calculateRadius(intensity);
   if(radius_m <= 0){
     if(circle != undefined){
       circle.setMap(null);
     }
   }
   if(circle == undefined){
      circle = new google.maps.Circle ({
      map: map,
      center: global_position,
      radius: radius_m,
      strokeColor: "red",
      fillColor: "red",
      editable: false
    });
   }else{
     circle.setCenter(global_position);
     circle.setRadius(radius_m);
     circle.setMap(map);
   }
   drawLine(radius_m>0);
 }

 // calculate the radius of the wildfire area in meters
function calculateRadius(area){
  // convert acre to m square
  area_m2 = area*4046.86;
  radius_m = Math.sqrt(area_m2 / Math.PI);
  return radius_m;
}

function drawLine(fireOccur){
  if(fireOccur){
    let closestWb = getClosestDistance();
    let minLocation = closestWb['location'];
    drawWaterbodyMarker(closestWb);
    let lineCoord = [global_position, minLocation];
    if(toWaterLine == undefined){
      toWaterLine = new google.maps.Polyline({
        path: lineCoord,
        strokeColor: "green",
        strokeOpacity: '0',
        icons: [{
          icon: lineSymbol,
          offset: '0',
          repeat: '20px'
        }],
        map: map
      });
    }else{
      toWaterLine.setPath(lineCoord);
      toWaterLine.setMap(map);
    }
  }else{
    if(toWaterLine != undefined){
      toWaterLine.setMap(null);
    }
    if(waterbodyMarker != undefined){
      waterbodyMarker.setMap(null);
    }
  }
}

function drawWaterbodyMarker(closestWb){
  var text = (closestWb['name'] + '\n' + getDistanceInKm(closestWb['location']).toFixed(2) + ' km')
  if(waterbodyMarker == undefined){
    waterbodyMarker = new google.maps.Marker({
    position: closestWb['location'],
    title:"waterbody",
    label: text,
    icon: watericon,
    map:map
    });
  }else{
    waterbodyMarker.setPosition(closestWb['location']);
    waterbodyMarker.setTitle("waterbody");
    waterbodyMarker.setLabel(text);
    waterbodyMarker.setMap(map);
  }
    
}

function getClosestDistance(){
  
  let waterbodyLoc = {
    lat:parseFloat(waterbody[0]['lat']),
    lng:parseFloat(waterbody[0]['long'])
  };
  let minDistance = getDistance(waterbodyLoc);
  let closestWaterBody = {
    'distance':getDistance(waterbodyLoc),
    'name':waterbody[0]['name'],
    'location':waterbodyLoc
  };
  waterbody.forEach(function(wb){
    let location = {
      lat:parseFloat(wb['lat']),
      lng:parseFloat(wb['long'])
    };
    let d = getDistance(location);
    if(d < minDistance){
      closestWaterBody['distance'] = d;
      closestWaterBody['location'] = location;
      closestWaterBody['name'] = wb['name'];
      minDistance = d;
    }    
  });
  return closestWaterBody;
}

function getDistance(location){
  var x = location['lat'] - global_position['lat'];
  var y = location['lng'] - global_position['lng'];
  return Math.sqrt(Math.pow(x,2) + Math.pow(y,2));
}

function getDistanceInKm(latlng){
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(global_position['lat']-latlng['lat']);  
  var dLon = deg2rad(global_position['lng']-latlng['lng']);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(latlng['lat'])) * Math.cos(deg2rad(global_position['lat'])) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg){
  return deg * Math.PI / 180;
}

 /*
 * Hides the "Please select..." message and shows the predicton results
 */
 function hideIntroMessage () {
   document.getElementById('help-message').style.display = 'none';
   document.getElementById('ml').style.display = 'flex'
 }

 /*
 * Updates the lat/long values shown in the HTML
 */
 function showLatLng() {
   document.getElementById("txtLat").innerHTML = global_position.lat.toFixed(3);
   document.getElementById("txtLong").innerHTML = global_position.lng.toFixed(3);
 }

 function geocodeLatLng(geocoder, map, infowindow) {
   // check if the clicked point is over the ocean or not
   geocoder.geocode({'location': global_position}, function(results, status) {
     if (status === 'OK') {
       if (results[0]) {
         placeMarker(global_position);
         getWatsonMLIntensity(global_position);
       } else {
         window.alert('No results found');
       }
     } else {
      window.alert('We cannot predict fire brightness over the ocean!');
    }
  });
 }

 function setBarWidth(value) {
   var scale = {
     min : 225,
     max : 370
   }
   // calculate % along scale, i.e. width of the bar
   var width = 100 * (value - scale.min)/(scale.max - scale.min)
   // if width < 0, set to 0
   width = (width < 0 ? 0 : width)
   // if width > 100, set to 100
   width = (width > 100 ? 100 : width)
   // set the width of the bar
   document.getElementById('bar-fill').style.width = width + '%';

   // define an array of colors to set the bar to, depending on <width>
   var colors = ['#aa0202', '#ff5500', '#ffa500', '#ffd800', '#f8e683']
   // how big is each color category
   var binSize = (scale.max - scale.min)/(colors.length + 1)
   // get the relevant color from the array, based on the width of the bar
   color = colors[Math.round(width/binSize)]
   // set the color of the bar
   document.getElementById('bar-fill').style.backgroundColor = color;
 }

 function processOK(response) {
     console.log("response");
     console.log(response);

     document.getElementById("ml-output").innerHTML = response.values[0][8].toFixed(2);
     // get the intensity value
     intensity = response.values[0][8];
     setBarWidth(response.values[0][8])
     drawCircle()
 }

 function processNotOK() {
     chat('Error', 'Error whilst attempting to talk to Watson Machine Learning');
 }

 function getWatsonMLIntensity(message) {
     console.log('checking stashed context data');
     console.log(message);

     let temp = document.getElementById("temp").value;
     let wind = document.getElementById("wind").value;
     let precip = document.getElementById("precip").value;
     let humidity = document.getElementById("humidity").value;
     let pressure = document.getElementById("press").value;

     const weather = {
      temp,
      wind,
      precip,
      humidity,
      pressure
     }
     const payload = {...message, ...weather};
     console.log(weather);

     var ajaxData = {};
     ajaxData = payload;

     $.ajax({
     	type: 'POST',
     	url: 'modelintensity',
     	data: ajaxData,
     	success: processOK,
     	error: processNotOK
     });
 }

 function readJson(){
  $.getJSON( "./resources/waterbody.json", function( json ) {
    waterbody = json;
   });

  lineSymbol = {
    path: 'M 0,-1 0,1',
    strokeOpacity: 1,
    scale: 4
  };

   watericon= {
    url: "./icons/waterdrop.png", // url
    scaledSize: new google.maps.Size(50, 50), // scaled size
    origin: new google.maps.Point(0,0), // origin
    anchor: new google.maps.Point(25, 25) // anchor
};

   
 }