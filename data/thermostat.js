var util = require('util');

var Node = require('./deviceTree').Node;

var Thermostat = function() {
  Node.call(this);
//  this.temperature = 40;
  this.temperature = 20;
  this.minimumTemp = 10;
  this.powerSaving = true;
  this.savingOffMaxTemp = 32;
  this.savingOnMaxTemp = 25;
  this.powerSavingText = "PSM ON";
 
this.increaseTemperature = function(changeTempBy) {
  if (((this.temperature + changeTempBy) > this.savingOnMaxTemp) && this.powerSaving) {
    return this.temperature = this.savingOnMaxTemp;      
  }
  
    else if (((this.temperature + changeTempBy) > this.savingOffMaxTemp) && this.powerSaving === false) {
    return this.temperature = this.savingOffMaxTemp;
  }
  else {
    return this.temperature += changeTempBy;
  } 
}

//};

this.decreaseTemperature = function(changeTempBy) {
  if ((this.temperature - changeTempBy) < this.minimumTemp) {
    return this.temperature = this.minimumTemp;
  }
  else {
    return this.temperature -= changeTempBy;
  };
};

this.powerSavingToggle = function() {
  (this.powerSaving) ? (this.powerSaving = false) : (this.powerSaving = true);
  if ((this.powerSaving) && (this.temperature > 25)) {this.temperature = this.savingOnMaxTemp};
};

this.reset = function() {
  this.temperature = 20;
  this.powerSaving = true;
};

this.colorStatus = function() {
  if (this.temperature < 18) {
    return "low-usage"
  }
  else if (this.temperature > 25) {
    return "high-usage"
  }
  else {
    return "medium-usage"
  }
};

this.psmStatus = function() {
  (this.powerSaving) ? (this.powerSavingText = "PSM ON") : (this.powerSavingText = "PSM OFF");
};

this.setTemperature = function(thermostatTemperature) {
	this.temperature = thermostatTemperature;
};

this.getTemperature = function() {
	return this.temperature;
};  

};

util.inherits(Thermostat, Node);
module.exports = Thermostat;







