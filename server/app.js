/**
* Copyright 2017 IBM Corp. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*       http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/


/*jslint node: true*/
/*jslint es6 */
"use strict";

require('dotenv').config();

const bodyParser = require('body-parser');
const my_btoa = require("btoa");
const express = require("express");
const fs = require("fs");
const application = express();
const my_XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;


// Tokens obtained at startup
var token = "";
var wmlToken = "";

var scoring_url = "https://us-south.ml.cloud.ibm.com/v3/wml_instances/91e88168-d3ff-4410-99c9-422c3f2d6089/deployments/f84f4720-3b69-4cfd-864a-37d81b85b020/online";
//old endpoint
//https://us-south.ml.cloud.ibm.com/v3/wml_instances/91e88168-d3ff-4410-99c9-422c3f2d6089/deployments/9a5399c3-69e4-4125-a3aa-bbecfb5422d6/online
var wml_url = "https://us-south.ml.cloud.ibm.com";
var wml_username = "76082a78-3b73-4822-b9ee-5fcb3ccca0fd";
var wml_password = "21186fef-f3c4-4872-a94d-385ec7d701c3";
var map_apikey= "AIzaSyAQsWDIRvbFxp6-lGl2tenjo70S2Eejdg0";

application.use(bodyParser.urlencoded({ extended: true }));

application.use(express.static(__dirname + "/public"));

application.post('/modelintensity', function(req, res) {
 // NOTE: manually define and pass the array(s) of values to be scored in the next line
            const payload2 = '{"fields": ["lat", "lon", "weather__maxtempC", "weather__precip", "weather__humidity", "weather__pressure", "weather__wind"], "values": [['+ req.body.lat + ',' + req.body.lng + ',' + req.body.temp + ',' + req.body.precip + ',' + req.body.humidity + ',' + req.body.pressure + ',' + req.body.wind + ']]}';
    //var payload = '{"fields": ["latitude", "longitude"], "values": [[' + req.body.lat + ',' + req.body.lng + ']]}';
    console.log("hello world");
    wml_apiPost(scoring_url, wmlToken, payload2, function (resp) {
	let parsedPostResponse;
	try {
	    parsedPostResponse = JSON.parse(this.responseText);
	} catch (ex) {
	    console.log("Error parsing response.");
	}
	console.log("Scoring response");
	console.log(parsedPostResponse);
	if (parsedPostResponse.errors && parsedPostResponse.errors[0].message === "Expired authorization token."){
	  console.log("Token has expired. Requesting new token...")
	  getToken();
	}
	res.send(parsedPostResponse);

    }, function (error) {
	console.log(error);
    });
});


function wml_api_Get(url, username, password, loadCallback, errorCallback){
	const oReq = new my_XMLHttpRequest();
	const tokenHeader = "Basic " + my_btoa((username + ":" + password));
	const tokenUrl = url + "/v3/identity/token";

	oReq.addEventListener("load", loadCallback);
	oReq.addEventListener("error", errorCallback);
	oReq.open("GET", tokenUrl);
	oReq.setRequestHeader("Authorization", tokenHeader);
	oReq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	oReq.send();
}

function wml_apiPost(scoring_url, token, payload, loadCallback, errorCallback){
	const oReq = new my_XMLHttpRequest();
	oReq.addEventListener("load", loadCallback);
	oReq.addEventListener("error", errorCallback);
	oReq.open("POST", scoring_url);
	oReq.setRequestHeader("Accept", "application/json");
	oReq.setRequestHeader("Authorization", token);
	oReq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	oReq.send(payload);
}

function getToken(){
    wml_api_Get(wml_url,
	wml_username,
	wml_password,
	function (res) {
          let parsedGetResponse;
          try {
            parsedGetResponse = JSON.parse(this.responseText);
          } catch(ex) {
            // TODO: handle parsing exception
          }
          if (parsedGetResponse && parsedGetResponse.token) {
            token = parsedGetResponse.token;
            wmlToken = "Bearer " + token;
          } else {
            console.log("Failed to retrieve Bearer token");
	  }
	}, function (err) {
	    console.log(err);
	  }
    );
}

fs.readFile("public/index.html", 'utf8', function (err,data) {
  if (err) {
    console.log("error: " + err);
    return;
  }

  var result = data.replace("APIKEY", map_apikey);
  fs.writeFile("public/index.html", result, 'utf8', function (err) {
      console.log("FS Write Err: " + err);
  });
});

getToken();

const port = 3000;

application.listen(port, function () {
    console.log("Server running on port: %d", port);
});
