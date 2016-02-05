'use strict';

var b = require('bonescript');

var jStat = require('jstat').jStat;   // not presently used

var http = require('http'),
    path = require('path');

var express = require('express'),
    socket = require('socket.io'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    flash = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var port  = process.env.PORT || 3300;

var app = express();
var server = http.createServer(app);
server.listen(port);
var io = socket.listen(server);

var configDB = require('./config/database.js');

app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
console.log(__dirname);
app.use(express.static(path.join(__dirname, 'bower_components')));

// configuration ================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.set('view engine', 'ejs');

// required for passport
app.use(session({ secret: 'iolearncomtutorials' })); //session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// Ref: http://socket.io/docs/server-api/
// Register a middleware, which is a function that gets executed for
// every incoming Socket and receives as parameter the socket and a
// function to optionally defer execution to the next registered
// middleware.
// Errors passed to middleware callbacks are sent as special error
// packets to clients.  TODO: Handle error at client.

io.use(function(socket, next){
    if (socket.request.headers.cookie) return next();
    next(new Error('Authentication error'));
});

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

console.log('The magic happens on port ' + port);

var logger = require('./services/logger'),
    mappings = require('./data/mappings'),
    users = require('./data/users'),
    customerService = require('./services/customerService.js');
	
 users.latest(function(err, first1) {
    console.log("first " + first1[0].username);
  });
	
//users.create('johnmeisner', 'May011983', 
//    function() {console.log("%%%%%%%added user%%%%%%%%%%%")});

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

var sampleNum = 0;
var tempSetpt = 70; 

var weatherReportNumber = 0;	

//Notes:
// 1) Fan is controlled by UI input .... manual controlled
// 2) No need for hysteresis for fan or heat cuz consitioned on damper open and it has hysteresis in tempController

// setup listeners when controllers provide new damper position
for (var i =0 ; i < controllerList.length; i++) {
    var index = i;
		
    controllerList[i].on('newDamperPosition', function(damperPosition, name, roomNumber) {
        d.setDamperPosition(index, damperPosition, roomNumber);	

// Since no other room than bedroom really exists qualify on name equal 'bedroom' 			
        if(((damperPosition == 'open') && (name == 'bedroom'))) {
				
            if ((Number(d.getThermostatTemperature(roomNumber)) > d.getRoomTemp(roomNumber)) || heatSet) {
			    d.setBuildingActuator('heat', 'on');
				d.setBuildingActuator('air', 'off');
				heatSet = 1;
            }

			if ((Number(d.getThermostatTemperature(roomNumber)) < d.getRoomTemp(roomNumber)) || airSet) {
			    d.setBuildingActuator('air', 'on');
                d.setBuildingActuator('heat', 'off');
                airSet = 1;
            }				
        }

        else {          
            heatSet = 0;
            airSet = 0;				
        }	
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
		
		// invoke run() for each controller
        controllerList[i].run(deviceValues);
    };
	
});	  	

// test out line chart
app.get('/chart', function (req, res) {
    res.render('./tests/lineChart', {
    });
});   

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




