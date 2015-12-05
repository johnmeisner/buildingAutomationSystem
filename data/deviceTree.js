'use strict';

var Node = function (name, id) {
    this.children = [];
	this.name = '';
	this.ID = id || " ";	
	this.SN = undefined;
	this.value = undefined;
	this.type = undefined;
	this.Date = new Date();
	
	this.add = function(child) {
        this.children.push(child);
	};
		
    this.remove = function(child) {
	    var length = this.children.length;
		for (var i = 0; i < length; i++) {
	        if (this.children[i] === child) {
			    this.children.splice(i, 1);
				return;
			}
		}	
	};
	
	this.getChild = function(i) {
	    return this.children[i];
	};
	
	this.hasChildren = function() {
	    return this.children.length > 0;
	};

    this.updateValue = function(value) {
	    this.value = value;
    };
	
	this.getValue = function() {
	    return this.value;
	};		
	
};  

var deviceList = [];
var deviceListValues = [];

function traverse(node, qtype, value) {

    if (node.SN != undefined) {         // if SN not undefined must be a device node
	    if (qtype === undefined) {
//	       console.log("Device SN: " + node.SN + " type: " + node.type + " value: " + node.value + " name: " + node.name);
		   deviceList.push(node.name);
        }
        else if (qtype === 'valueUpdate') {
            node.updateValue.call(node, value);
			node.Date = Date();
		}
		else if (qtype === 'valueGet') {
		    return node.value;
		}
		
		else if (qtype === 'valueSet') {
		    node.value = value;
		}		
		
	}
	
	else {                              // must be a composite node so log node name
	    if (qtype === 'getTempSensor') {
		    for (var i = 0; i < node.children.length; i++) {
		        if (node.getChild(i).type ===  'sensorTemp') {
                    return node.getChild(i).value;					
                }				 
	        }
	    }

	    if (qtype === 'setTempSensor') {
		    for (var i = 0; i < node.children.length; i++) {
		        if (node.getChild(i).type ===  'sensorTemp') {
                    node.getChild(i).value = value;						
                }				 
	        }
	    }
		
		else if (qtype === 'setActuatorDamper') {
		    for (var i = 0; i < node.children.length; i++) {
		        if (node.getChild(i).type ===  'actuatorDamper') {				
                    node.getChild(i).value = value;	
                    console.log("setActuatorDamper: " + node.getChild(i).value);					
                }				 
	        }
	    }

		else if (qtype == 'getActuatorDamper') {
		    console.log("selected node is: " + node.name);
		    for (var i = 0; i < node.children.length; i++) {
		        if (node.getChild(i).type ===  'actuatorDamper') {
					console.log("getActuatorDamper: " + node.getChild(i).value);
					return node.getChild(i).value;
                }				 
	        }
	    }

		else if (qtype === 'setThermostatTemperature') {
		    for (var i = 0; i < node.children.length; i++) {
		        if (node.getChild(i).type ===  'thermostat') {
					console.log(node.getChild(i).name);
//                    node.getChild(i).value = value;
                    node.getChild(i).setTemperature(value);					
                }				 
	        }
	    }
		
        else if (qtype == 'getThermostatTemperature') {
		    console.log("selected node is: " + node.name);
		    for (var i = 0; i < node.children.length; i++) {
		        if (node.getChild(i).type ===  'thermostat') {
//					return node.getChild(i).value;
                    console.log(node.getChild(i).name);					
                    return node.getChild(i).getTemperature();
                }				 
	        }
	    }	

        else if (qtype == 'setFan') {
		    console.log("selected node is: " + node.name);
		    for (var i = 0; i < node.children.length; i++) {
		        if (node.getChild(i).type ===  'actuatorFan') {
                    console.log(node.getChild(i).name);					
                    node.getChild(i).value = value;
                }				 
	        }
	    }	
		
        else if (qtype == 'setHeat') {
		    console.log("selected node is: " + node.name);
		    for (var i = 0; i < node.children.length; i++) {
		        if (node.getChild(i).type ===  'actuatorHeat') {
                    console.log(node.getChild(i).name);					
                    node.getChild(i).value = value;
                }				 
	        }
	    }
		
        else if (qtype == 'setAir') {
		    console.log("selected node is: " + node.name);
		    for (var i = 0; i < node.children.length; i++) {
		        if (node.getChild(i).type ===  'actuatorAir') {
                    console.log(node.getChild(i).name);					
                    node.getChild(i).value = value;
                }				 
	        }
	    } 
	
        else if (qtype == 'getFan') {
		    console.log("selected node is: " + node.name);
		    for (var i = 0; i < node.children.length; i++) {
		        if (node.getChild(i).type ===  'actuatorFan') {
                    console.log(node.getChild(i).name);					
                    return node.getChild(i).value;
                }				 
	        }
	    }
		
        else if (qtype == 'getHeat') {
		    console.log("selected node is: " + node.name);
		    for (var i = 0; i < node.children.length; i++) {
		        if (node.getChild(i).type ===  'actuatorHeat') {
                    console.log(node.getChild(i).name);					
                    return node.getChild(i).value;
                }				 
	        }
	    }
		
        else if (qtype == 'getAir') {
		    console.log("selected node is: " + node.name);
		    for (var i = 0; i < node.children.length; i++) {
		        if (node.getChild(i).type ===  'actuatorAir') {
                    console.log(node.getChild(i).name);					
                    return node.getChild(i).value;
                }				 
	        }
	    }
	}
	
    for (var i = 0; i < node.children.length; i++) {
	    traverse(node.getChild(i));
    }
}; 

module.exports.deviceListValues = deviceListValues;
module.exports.deviceList = deviceList;
module.exports.traverse = traverse;
module.exports.Node = Node;