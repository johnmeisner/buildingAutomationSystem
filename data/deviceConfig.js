'use strict'

module.exports = function () {
return {
    tempSensor1:      {ID: 1, SN: 11111, type: 'sensorTemp', value: 67},	
	thermostat1:      {ID: 2, SN: 11112, type: 'thermostat', value: 90},       // virtual (UIs can set)
	damperActuator1:  {ID: 3, SN: 11113, type: 'actuatorDamper', value: 'closed'},
    tempSensor2:      {ID: 11, SN: 11121, type: 'sensorTemp', value: 77},	
	thermostat2:      {ID: 22, SN: 11122, type: 'thermostat', value: 50},       // virtual (UIs can set)
	damperActuator2:  {ID: 33, SN: 11123, type: 'actuatorDamper', value: 'closed'},	
    fan:              {ID: 4, SN: 11114, type: 'actuatorFan', value: 'off'},
    heat:             {ID: 5, SN: 11115, type: 'actuatorHeat', value: 'off'},
	air:              {ID: 6, SN: 11116, type: 'actuatorAir', value: 'off'},
	extTemp:          {ID: 7, SN: 11117, type: 'sensorExtTemp', value: 92}	   // virtual (Remote Web Service)
	};
};
