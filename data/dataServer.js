'use strict';

// Import Device Configuration Global data
var deviceConfig = require('./deviceConfig')();

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Weather = require('../services/weather');

var toggleFAN = require('./GPIODeviceDriver').toggleFAN;
var getFanOn = require('./GPIODeviceDriver').getFanOn;
var toggleHEAT = require('./GPIODeviceDriver').toggleHEAT;
var toggleAIR = require('./GPIODeviceDriver').toggleAIR;

var toggleDamper = require('./meshDeviceDriver').toggleDamper;
var damperPositionPrev = 'closed';

var Thermostat = require('./thermostat'),
    DeviceTree = require('./deviceTree'),
	deviceList = require('./deviceTree').deviceList,
    Node = require('./deviceTree').Node;

var w = new Weather,     
    d = DeviceTree;   // DeviceTree is object literal data structure, NOT a constructor function
	
// Create Device Tree Nodes Composites (ie., non-leaf / device)
var building = new Node(),
    bedroom = new Node(),
	livingRoom = new Node();
	
building.name = "Meisner Home";
bedroom.name = "bedroom";
livingRoom.name = "livingRoom";
	
var roomList = [bedroom, livingRoom];
	
var getTemp = require('./meshDeviceDriver').getTemp;
	
// Display Date/Time every 50 sec
var dPeriod = 50000;

// DataServer is responsible for creating Device Tree nodes which may be a device. 
// If ID = undefined then not a sensor node.
// Extend tempSensor1 instance of Node to include device properties
// TODO: No reason for unspecified parameters to occupy memory with undefined

//**** TODO: replace with UI API for installer to enter device info *****

// Building Actuators - Fan, Heat and Air	

var fan = new Node();
fan.name = "Fan";
fan.ID = deviceConfig.fan.ID;
fan.SN = deviceConfig.fan.SN;
fan.type = deviceConfig.fan.type;
fan.value = deviceConfig.fan.value;

var heat = new Node();
heat.name = "Heat";
heat.ID = deviceConfig.heat.ID;
heat.SN = deviceConfig.heat.SN;
heat.type = deviceConfig.heat.type;
heat.value = deviceConfig.heat.value;

var air = new Node();
air.name = "Air";
air.ID = deviceConfig.air.ID;
air.SN = deviceConfig.air.SN;
air.type = deviceConfig.air.type;
air.value = deviceConfig.air.value;

var extTemp = new Node();
extTemp.name = "Ext Temp";
extTemp.ID = deviceConfig.extTemp.ID;
extTemp.SN = deviceConfig.extTemp.SN;
extTemp.type = deviceConfig.extTemp.type;
extTemp.value = deviceConfig.extTemp.value;

// Sensors / Actuators	

var tempSensor1 = new Node();
tempSensor1.name = "Temp Sensor 1";
tempSensor1.ID = deviceConfig.tempSensor1.ID;
tempSensor1.SN = deviceConfig.tempSensor1.SN;
tempSensor1.type = deviceConfig.tempSensor1.type;
tempSensor1.value = deviceConfig.tempSensor1.value;

var tempSensor2 = new Node();
tempSensor2.name = "Temp Sensor 2";
tempSensor2.ID = deviceConfig.tempSensor2.ID;
tempSensor2.SN = deviceConfig.tempSensor2.SN;
tempSensor2.type = deviceConfig.tempSensor2.type;
tempSensor2.value = deviceConfig.tempSensor2.value;

var thermostat1 = new Thermostat();
thermostat1.name = "Thermostat 1";
thermostat1.ID = deviceConfig.thermostat1.ID;
thermostat1.SN = deviceConfig.thermostat1.SN;
thermostat1.type = deviceConfig.thermostat1.type;
thermostat1.value = deviceConfig.thermostat1.value;

var thermostat2 = new Thermostat();
thermostat2.name = "Thermostat 2";
thermostat2.ID = deviceConfig.thermostat2.ID;
thermostat2.SN = deviceConfig.thermostat2.SN;
thermostat2.type = deviceConfig.thermostat2.type;
thermostat2.value = deviceConfig.thermostat2.value;

var damperActuator1 = new Node();
damperActuator1.name = "Damper 1";
damperActuator1.ID = deviceConfig.damperActuator1.ID;
damperActuator1.SN = deviceConfig.damperActuator1.SN;
damperActuator1.type = deviceConfig.damperActuator1.type;
damperActuator1.value = deviceConfig.damperActuator1.value;

var damperActuator2 = new Node();
damperActuator2.name = "Damper 2";
damperActuator2.ID = deviceConfig.damperActuator2.ID;
damperActuator2.SN = deviceConfig.damperActuator2.SN;
damperActuator2.type = deviceConfig.damperActuator2.type;
damperActuator2.value = deviceConfig.damperActuator2.value; 

//*************************************************************************

//console.log("Data acquired at: " + tempSensor1.Date);	

// DataServer is now responsible for constructing Device Tree including node creation!!  
// All Device Tree functionality Responsibility is in deviceTree.js
// Ultimately dataServer listens to 'new sensor' event and then creates new zone

// Construct Device Tree

building.add(bedroom);
building.add(livingRoom);
building.add(fan);
building.add(heat);
building.add(air);
building.add(extTemp);

// bedroom
bedroom.add(tempSensor1);
bedroom.add(thermostat1);
bedroom.add(damperActuator1);

// livingRoom
livingRoom.add(tempSensor2);
livingRoom.add(thermostat2);
livingRoom.add(damperActuator2);

getTemp().on('sensorDataReady', function(tempF) {
//    d.traverse(tempSensor1, 'valueUpdate', tempF);                  // find tempSensor Node and update value
	d.traverse(bedroom, 'setTempSensor', tempF);	 
});

var index = 0;

//DataServer Class is meant to be a Singleton and inherits from EventEmitter. 
//Coordinates data tasks by listening / generating events (similar to Observer Pattern used in Alps).

function DataServer(wPeriod) {

// DataServer Properties

    var self = this;
	this.Rooms = ['Living Room'];
	this.RoomNumber = 1;
	this.extTempF = 70;
	this.roomTemp = tempSensor1.value;
	this.damperPosition = damperActuator1.value;

//	var fanPrev = 'off';
	var heatPrev = 'off';
	var airPrev = 'off';
	
    setInterval(function () {
	
	   if(d.traverse(building, 'getHeat') === 'on') { 
	       toggleHEAT(1); 
	   }
	   else {
		   toggleHEAT(0);
	   }
	   
	   if(d.traverse(building, 'getAir') === 'on') { 
	       toggleAIR(1) 
	   }
	   else {
		   toggleAIR(0);
	   }
	   
//	   if(d.traverse(bedroom, 'getActuatorDamper') === 'open') {

       for (var i = 0; i < roomList.length; i++) {
//		   if (d.traverse(bedroom, 'getActuatorDamper') !== damperPositionPrev) {
// Remeber only bedroom damper exists	
		   if (d.traverse(roomList[0], 'getActuatorDamper') !== damperPositionPrev) {
			   toggleDamper();
			   damperPositionPrev = d.traverse(bedroom, 'getActuatorDamper');		   
			}
		}
		
//	   }	   
	   
//	    console.log("\ndeviceList[] from traverse(building): " + d.deviceList);
//		console.log("\ndeviceListValues[] from traverse(building): " + d.deviceListValues);

// Correct for time zone ... UTC/GMT -8 hours ... No daylight saving time 
        var date = new Date();
		//var ts = String(Math.round(date.getTime()/1000) + date.getTimezoneOffset() * 60);
		var ts = String(Math.round(date.getTime()/1000) - (8 * 60 * 60));
		var t = new Date(ts*1000);
         
		//console.log("Date / Time is: " + Date() + "\n");
		console.log("Date / Time is: " + t + "\n" + ts + " " + (date.getTimezoneOffset() * 60));
    }, dPeriod);

// Data Acquisition Control Type Events	

// Weather Service:   Emit 'requestWeather' periodically to instantiate Weather 
    setInterval(function () {
	    EventEmitter.call(this);
		var w = new Weather;
		w.on('newWeather', function(t) {
		    console.log("DataServer: Load new ext temp into DeviceTree " + t);
			self.extTempF = t;
			self.emit('DeviceTreeUpdate');
		});
		
    }, wPeriod); 
	
// DataServer Class Methods

	this.getRoomName = function () {
        return this.Rooms;
	}
	
	this.getRoomNumber = function () {
	    return this.RoomNumber;
	}

    this.getExtTempF = function () {
        return this.extTempF;
    }	
	
    this.getRoomTemp = function (index) {
        return d.traverse(roomList[index], 'getTempSensor');
    }	
	
	this.getThermostatTemperature = function (index) {
	    Thermostat.call(this); 
		this.temperature = d.traverse(roomList[index], 'getThermostatTemperature');
		this.temperature = (((this.temperature * 9) / 5) + 32);
		console.log("room name is: " + roomList[index].name);
//		console.log("thermostat is: " + this.temperature);
		return this.temperature;
	}

// setThermostatTemperature method is invoked by app.js when user changes setpt
// and passes the new value for roomNumber	
	this.setThermostatTemperature = function(thermostatTemperature, index) {
        d.traverse(roomList[index], 'setThermostatTemperature', 
		thermostatTemperature); 
		console.log("\nThermostat passed is:");
		console.log(thermostatTemperature)
		console.log("\n");
	}
	
	this.getDamperPosition = function (index) {
        return d.traverse(roomList[index], 'getActuatorDamper');
	}
	
	this.setDamperPosition = function (index, damperPosition, roomNumber) {		
		d.traverse(roomList[roomNumber], 'setActuatorDamper', damperPosition);  
	}

	this.setBuildingActuator = function (buildingActuator, onOff) {		
        switch(buildingActuator) {
		    case 'fan':
			   	console.log(" set fan to " + onOff); 
			    d.traverse(building, 'setFan', onOff);
				break;
			case 'heat':
				console.log(" set heat to " + onOff);
			    d.traverse(building, 'setHeat', onOff);
				break;
			case 'air':
			    console.log(" set air to " + onOff);
			    d.traverse(building, 'setAir', onOff);
				break;
			default:
			    console.log("no such building actuator");
		}
  
	}	
	
	this.getBuildingActuator = function (buildingActuator) {		
//	    console.log(" get fan on/off ");
        switch(buildingActuator) {
		    case 'fan':
				console.log(" get fan");
			    return d.traverse(building, 'getFan');
			case 'heat':
				console.log(" get heat");
			    return d.traverse(building, 'getHeat');
			case 'air':
				console.log(" get air");
			    return d.traverse(building, 'getAir');
			default:
			    console.log("no such building actuator");
		}
  
	}	

};

util.inherits(DataServer, EventEmitter);
module.exports = DataServer;