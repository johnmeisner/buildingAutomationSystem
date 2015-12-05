//******************* Customer Service ********************************

function customerService() {
// Twilio Credentials 
var accountSid = 'ACd2695876597893c675a6438f5c0f9ea4'; 
var authToken = '25895444137ec2724c5d690781cbf918'; 
 
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
