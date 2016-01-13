'use strict';

var b = require('bonescript');

var jStat = require('jstat').jStat;

var http = require('http'),
    path = require('path'),
	passport = ('passport-local');

var express = require('express'),
    socket = require('socket.io');

var logger = require('./services/logger'),
    mappings = require('./data/mappings'),
	customerService = require('./services/customerService.js');

var app = express();

// presently fan control is manual 
var toggleFAN = require('./data/GPIODeviceDriver').toggleFAN;       

// Mesh Actuators ... provided for test purposes
var toggleDamper = require('./data/meshDeviceDriver').toggleDamper;

var getTemp = require('./data/meshDeviceDriver').getTemp;
var tempF = require('./data/meshDeviceDriver').tempF;

var TempController = require('./controllers/tempController');

var onOff = 'off';
var heatSet = 0;
var airSet = 0;
var damperSet = 0;
var damperPosition = damperPosition || 0;;

var controllerList = [];

controllerList.push(new TempController('bedroom', 0));
controllerList.push(new TempController('livingRoom', 1));
 
for (var i = 0; i < controllerList.length; i++) {
//	console.log("app: controllerList: " + controllerList[i].name);
};

var deviceValues = {};                          // device readings object

// Main application in this file shouldn't care how real-time data is acquired.
// Should only care about the application logic so should only need access to DataSever and Controller objects.

var DataServer = require('./data/dataServer'); 
 
// Configuration
var weatherPeriod = 60000;             // Weather every weatherPeriod sec

// Instantiate BMS Objects
var d = new DataServer(weatherPeriod);         // instantiates DataServer 

mappings.create(d.getRoomTemp(0), 0, function() {console.log("finished creating collection")});

var sampleNum = 0;
var tempSetpt = 70; 

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('beaglebone'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));

var weatherReportNumber = 0;	

//Notes:
// 1) Fan is controlled by UI input .... manual controlled
// 2) No need for hysteresis for fan or heat cuz consitioned on damper open and it has hysteresis in tempController

// setup listeners when controllers provide new damper position
for (var i =0 ; i < controllerList.length; i++) {
    var index = i;
		
	controllerList[i].on('newDamperPosition', function(damperPosition, name, roomNumber) {
//		console.log("Got new damper position from controller " + damperPosition + " for " + name);
        d.setDamperPosition(index, damperPosition, roomNumber);	
			
//		console.log("damperPosition: " + damperPosition);
//		console.log("name: " + name);

// Since no other room than bedroom really exists qualify on name equal 'bedroom' 			
        if(((damperPosition == 'open') && (name == 'bedroom'))) {
//            console.log("roomTemp tree value: " + d.getRoomTemp(roomNumber));
//            console.log("ThermostatTemperature tree value: " + d.getThermostatTemperature(roomNumber));
				
            if ((Number(d.getThermostatTemperature(roomNumber)) > d.getRoomTemp(roomNumber)) || heatSet) {
//				    console.log("heat for tr < tt: " + d.getBuildingActuator('heat'));
					d.setBuildingActuator('heat', 'on');
					d.setBuildingActuator('air', 'off');
					heatSet = 1;
				}

				if ((Number(d.getThermostatTemperature(roomNumber)) < d.getRoomTemp(roomNumber)) || airSet) {
//					console.log("heat for tr > tt: " + d.getBuildingActuator('heat'));
			        d.setBuildingActuator('air', 'on');
					d.setBuildingActuator('heat', 'off');
					airSet = 1;
				}				
			}

            else {          
					heatSet = 0;
					airSet = 0;				
			}
				
//			console.log("fan position is " + d.getBuildingActuator('fan'));	
		});
		
};		

d.on('DeviceTreeUpdate', function() {
    weatherReportNumber++;
	
// Reset heatSet and airSet before processing Controller and Control Elements	
	if (heatSet === 0) { d.setBuildingActuator('heat', 'off'); }	
	if (airSet === 0) { d.setBuildingActuator('air', 'off'); }
	
	for (var i = 0; i < controllerList.length; i++) {
	    
		// update device values for each controller
        deviceValues.t = d.getRoomTemp(i);
	    deviceValues.e = d.getExtTempF(controllerList[i].name);
        deviceValues.d = d.getDamperPosition(i);	   
	    deviceValues.ts = d.getThermostatTemperature(i);
		
//		console.log("controller: " + controllerList[i].name + " running")
		
		// invoke run() for each controller
        controllerList[i].run(deviceValues);
	};
	
});	
		
/**************** Set Routes  ****************************************/
app.get('/', function (req, res) {
    res.render('thermoIndex', {
  });
});

// test out line chart
app.get('/chart', function (req, res) {
    res.render('./tests/lineChart', {
    });
});

/***************** Setup hhtp and Socket Servers   *******************/
var server = http.createServer(app);
server.listen(3100);
var io = socket.listen(server);

/***************** Handle Server-Client Socket Comm   *******************/
io.sockets.on('connection', function (socket) {
    io.sockets.emit('serverSetpt', d.getThermostatTemperature(0)); 
 
	if (d.getDamperPosition(0) == 'open') {
		damperPosition = 0;
		}
	else {
	    damperPosition = 1;
	}
	io.sockets.emit('newDamperPosition', damperPosition);

	io.sockets.emit('newDamperPosition', 1);
    mappings.list(function (err, documents) {
    socket.emit('list', documents);
    });

    socket.on('update', function () {
        mappings.list(function (err, documents) {
            if (err) {
		        console.log("ERROR");
		    }
		    if (!documents) {
		        console.log("No documents");
		    }
		        io.sockets.emit('list', documents);
        });
   });	   
  
    socket.on('toggleFan', function () {
	    toggleFAN();
   });  
  
   socket.on('toggleDamper', function () {
       toggleDamper();
   });    
  
   socket.on('addTemp', function (mapping) {
     getTemp().on('sensorDataReady', function(tempF) {
		var damper;
		if (d.getDamperPosition(0) == 'open') {
			damper = 85;
			damperPosition = 0;
		}
		else {
		    damper = 65;
			damperPosition = 1;
		}
		io.sockets.emit('newDamperPosition', damperPosition);
     	io.sockets.emit('newTemp', tempF, damper, d.getThermostatTemperature(0), sampleNum);
	})
  });
  
   socket.on('newTempSetpt', function (tempSetpt_sent) {
       tempSetpt_sent = (tempSetpt_sent - 32) * (5 / 9);       // convert from F to C	 
	   d.setThermostatTemperature(tempSetpt_sent, 0);
	   console.log("app: Thermostat Setpoint Changed to " + tempSetpt_sent + " C");
       io.sockets.emit('serverSetpt', d.getThermostatTemperature(0));	 
  });

   socket.on('customerServiceRequest', function () {
      customerService();
	  console.log("Customer Service Request Submitted");	 
  }); 
  
});




