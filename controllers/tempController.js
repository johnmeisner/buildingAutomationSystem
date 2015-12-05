'use strict';
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var toggleDamper = require('../data/meshDeviceDriver').toggleDamper;

var Hysteresis = require('hysteresis');

function TempController (roomName, roomNumber) {

// private variables
   var check; 
   var didCross;

// public variables   
   this.name = roomName || "";
   this.roomNumber = roomNumber; 
   this.damperPosition = 'closed';                   // TempController can modify it's damper's position
   this.extTempF = 69;
   this.thermostatTemperature = 70;
   this.roomTemp = 68;
   var self = this;

   this.getControllerName = function () {
       return this.name;	   
   };
   
   this.getControllerRoomNumber = function () {
       return this.roomNumber;	   
   };
   
   this.setDamperPosition = function (damperPosition) {
	   this.damperPosition = damperPosition;
       console.log("TempController damperPosition is " + this.damperPosition)	   
   };
   
   this.getDamperPosition = function () {
	   return this.damperPosition;   
   };

   this.setExtTempF = function (extTempF) {
	   this.extTempF = extTempF;	   
   };
   
   this.getExtTempF = function() {
       return this.extTempF;
   };

   this.setThermostatTemperature = function (thermostatTemperature) {
	   this.thermostatTemperature = thermostatTemperature;	   
   };
   
   this.getThermostatTemperature = function() {
       return this.thermostatTemperature;
   };
   
    this.setRoomTemp = function (roomTemp) {
	   this.roomTemp = roomTemp;	   
   };

    this.getRoomTemp = function() {
	    return this.roomTemp;
    };	

    this.run = function (deviceValues) {

		this.roomTemp = deviceValues.t;
		this.extTempF = deviceValues.e;
		this.damperPosition = deviceValues.d;
		this.thermostatTemperature = deviceValues.ts;
		
	    console.log("tempController: " + "roomTemp is " + this.roomTemp + " thermostat Temperature is " + this.thermostatTemperature);
		
// ************************************ Heat Control *****************************************************	

        if (this.roomTemp > this.extTempF) {
            check = Hysteresis([(this.thermostatTemperature - 2),(this.thermostatTemperature + 2)],  
		    {initialSide: 0});                               // setup hysteresis
            didCross = check(Number(this.roomTemp));	     // verify crossed considering hysteresis
		
		    console.log("\n*************\ntempController: didCross is " + didCross + "\nTermostatTemperature is " + this.thermostatTemperature + "\nroomTemp is " + this.roomTemp + "\n*****************\n");
		
// RoomTemp crossed LowThreshold from above .. so open damper
	        if ((didCross === 1) || (didCross === 0 && (this.roomTemp < (this.thermostatTemperature - 2)))) {	
	            if (this.damperPosition === 'closed') {		    
//	                toggleDamper();                         // move to app.js; invoke global toggleDamper
		        }
		        this.damperPosition = 'open';
		        EventEmitter.call(this);
		        self.emit('newDamperPosition', this.damperPosition, this.name, this.roomNumber);
            }	

// RoomTemp crossed HighThreshold from below .. so close damper		
            if (didCross === 2 || (didCross === 0 && (this.roomTemp > (this.thermostatTemperature + 2)))) {
		        if (this.damperPosition === 'open') {
//			        toggleDamper();
			    }
			    this.damperPosition = 'closed';
		        EventEmitter.call(this);
		        self.emit('newDamperPosition', this.damperPosition, this.name, this.roomNumber);
		    }
				
	    }	// heat control end
		
// *********************************** Air Control *****************************************************		

        else if (this.roomTemp < this.extTempF) {
            check = Hysteresis([(this.thermostatTemperature - 2),(this.thermostatTemperature + 2)],  
		    {initialSide: 0});   // setup hysteresis
            didCross = check(Number(this.roomTemp));	     // verify crossed considering hysteresis
		
		    console.log("\n*************\ntempController: didCross is " + didCross + "\nTermostatTemperature is " + this.thermostatTemperature + "\nroomTemp is " + this.roomTemp + "\n*****************\n");
		
// RoomTemp crossed LowThreshold from above .. so open damper
	        if ((didCross === 1) || (didCross === 0 && (this.roomTemp < (this.thermostatTemperature - 2)))) {	
	            if (this.damperPosition === 'open') {		    
//	                toggleDamper();                           // move to app.js; invoke global toggleDamper 
		        }
		        this.damperPosition = 'closed';
		        EventEmitter.call(this);
		        self.emit('newDamperPosition', this.damperPosition, this.name, this.roomNumber);
            }	

// RoomTemp crossed HighThreshold from below .. so close damper		
            if (didCross === 2 || (didCross === 0 && (this.roomTemp > (this.thermostatTemperature + 2)))) {
		        if (this.damperPosition === 'closed') {
//			        toggleDamper();
			    }
			    this.damperPosition = 'open';
		        EventEmitter.call(this);
		        self.emit('newDamperPosition', this.damperPosition, this.name, this.roomNumber);
		    }
				
	    }	                      // air control end	
	
	    else {
            EventEmitter.call(this);
		    self.emit('newDamperPosition', 'closed', this.name, this.roomNumber); 
		}
	
    }	                          // run() end
   
};   

module.exports = TempController;

util.inherits(TempController, EventEmitter);