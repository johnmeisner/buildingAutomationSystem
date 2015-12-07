'use strict';

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var request = require('request');
var globals = require('../globals');

function Weather() {
    EventEmitter.call(this);
    var self = this;	
	
    request({  
        url: globals().weatherUrl,
//		port: globals().port,
//		proxy: globals().proxy                 
    }, 

        function (error, response, body) {
            if (!error && response.statusCode == 200) {  
  
//          Parse / process JSON returned from weather server
	            var bodyStr = JSON.parse(body);			

//          Calculate temp in F	
	            var tempExtF = (bodyStr.main.temp-273.15)*1.8 + 32;   // TODO: Create private helper method to do conv				
	            tempExtF = tempExtF.toFixed(2);
	            var tempExtFMax = (bodyStr.main.temp_max-273.15)*1.8 + 32;
	            tempExtFMax = tempExtFMax.toFixed(2);
	            var tempExtFMin = (bodyStr.main.temp_min-273.15)*1.8 + 32;
	            tempExtFMin = tempExtFMin.toFixed(2);
			
			    this.extTempF = tempExtF;
			
			    EventEmitter.call(self);
			    self.emit('newWeather', tempExtF);                     // emit event indicating new temperature
	
	            console.log("\nweather object: New value from Weather Service " + tempExtF + " F in " + bodyStr.name);
        }
		
        else  {
  
     // Print error object if not null or status code is not 200
        console.log('error!! ', error);
        }

    })
	
};

util.inherits(Weather, EventEmitter);

module.exports = Weather;