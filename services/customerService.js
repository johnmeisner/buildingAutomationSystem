//******************* Customer Service ********************************

var globals = require('../globals');

function customerService() {
// Twilio Credentials 
var accountSid = globals().accountSid; 
var authToken = globals().authToken;
 
//require the Twilio module and create a REST client 
var client = require('twilio')(accountSid, authToken);

console.log("accountsid= "+accountSid+"authToken= "+ authToken); 
 
client.messages.create({ 
	to: "8587354061", 
	from: "+18583751731", 
	body: "My HVAC System is not working properly",	
}, function(err, message) { 
    console.log(err);
	console.log(message.sid); 
});

}; 

module.exports = customerService;
