'use strict';

// Includes toggleFan(), toggleAir() and toggleHeat()

var fanOn = fanOn || 0;
var heatOn = heatOn || 0;
var airOn = airOn || 0;

/***************** Toggle Fan   *******************/
function toggleFAN() {
    var b = require('bonescript');
    b.pinMode("P9_42", b.OUTPUT);
    fanOn = fanOn ? 0 : 1;
//    if (fanOn == 1) {
//        heatOn = 1  ; airOn = 1;
//        toggleHEAT(); toggleAIR();
//    }
    b.digitalWrite("P9_42", fanOn);            //P9_42
	console.log("GPIODeviceDriver: fanOn: ", fanOn);
};

function getFanOn() {
    return fanOn;
};

/***************** Toggle Heat   *******************/
function toggleHEAT(heatState) {
    var b = require('bonescript');
    b.pinMode("P9_27", b.OUTPUT);
//    heatOn = heatOn ? 0 : 1;
      if (heatState === 1) {
          heatOn = 1;
//    if (heatOn == 1) {
//        airOn = 1  ; fanOn = 1;
//        toggleAIR(); toggleFAN();
      }
	  else {
		  heatOn = 0;
	  }
    b.digitalWrite("P9_27", heatOn);           //P9_27
};

/***************** Toggle Air   *******************/
function toggleAIR(airState) {
    var b = require('bonescript');
    b.pinMode("P9_23", b.OUTPUT);
//    airOn = airOn ? 0 : 1;
    if (airState === 1) {
        airOn = 1;
//    if (airOn == 1) {
//        heatOn = 1  ; fanOn = 1;
//        toggleHEAT(); toggleFAN();
    }
	else {
	    airOn = 0;
	}
	
    b.digitalWrite("P9_23", airOn);             //P9_23
};


/* Exports  */
module.exports.toggleFAN = toggleFAN;
module.exports.toggleHEAT = toggleHEAT;
module.exports.toggleAIR = toggleAIR;
module.exports.getFanOn = getFanOn;
