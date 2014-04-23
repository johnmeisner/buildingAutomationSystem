'use strict'

var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();

/***************** Serial data to Damper xBee   *******************/

var mappings = require('./mappings'); 

var sampleNum = 0,
    Angle = 0,
    newFrame = true,
    tempF = 68,
    damperOn = 1;

var damp1Addr = [0x00, 0x13, 0xA2, 0X00, 0X40, 0XC0, 0XAD, 0X37];
var temp1Addr = [0x00, 0x13, 0xA2, 0X00, 0X40, 0XC0, 0XA9, 0X99];

var globals = require('../globals')();
 
function toggleDamper() {

    damperOn = damperOn ? 0 : 1;     // toggle damper full open / full closed
    if (damperOn == 1) {
	    Angle = 15;
    }
	else {
	    Angle = 0;
	}    	

    var atCmd6;
	var atCmd4;
	var atCmd3;
	var atCmd2;

//atCmdx = 0x05 DIOx config output high, = 0x04 to output low at Damper xBee GPIO
    if ((Angle & 0x8) == 0x8) {                     // ANGL[3:0] = [D6, D4, D2, D1]
        atCmd6 = "0x05";}  
    else {
       atCmd6 = "0x04";} 

    if ((Angle & 0x4) == 0x4) {                     // ANGL[3:0] = [D6, D4, D2, D1]
        atCmd4 = "0x05";}//   
    else { 
        atCmd4 = "0x04";}//   
            
    if ((Angle & 0x2) == 0x2) {                    // ANGL[3:0] = [D6, D4, D2, D1]
        atCmd3 = "0x05";}//   
    else {
        atCmd3 = "0x04";}//   
                
    if ((Angle & 0x1) == 0x1) {                    // ANGL[3:0] = [D6, D4, D2, D1]
        atCmd2 = "0x05";}//   
    else {
        atCmd2 = "0x04";}   

// following code only guarantees that delay between frames is at least 10 msec		
    sendCmd(damp1Addr, "D2", atCmd2);
	setTimeout(function(){
	    setTimeout(function(){		
		    setTimeout(function(){		   		   
		    sendCmd(damp1Addr, "D6", atCmd6)},10); 		
		sendCmd(damp1Addr, "D4", atCmd4)},10);	
	sendCmd(damp1Addr, "D3", atCmd3)},10);
	return;
}         // end toggleDamper

function sendCmd(addr, atCmd, cmdData) {
// address is a 64 bit variable or 8 bytes example
// var addr = [0x00, 0x13, 0xA2, 0X00, 0X40, 0XC0, 0XA9, 0X99];
// 7E 00 0F 17 BE 00 13 A2 00 40 C0 AD 37 FF FE 02 41 43 0E
// 0 <= angle <= 1
    var port = '/dev/ttyO2'; // set UART port
    var options = { baudrate: 9600};

//    var start = [0x7E, 0x00, 0x10, 0x17, 0x01];// start the packet
    var start = [0x7E, 0x00, 0x10, 0x17, 0x00];// start the packet
    var addr16 = [0xFF, 0xFE];// 16 address not used
    var cmdOp = 0x02; // apply changes on remote device 
//    var cmdOp = 0x00; // apply changes on remote device
    var atCmdin = [atCmd.charCodeAt(0), atCmd.charCodeAt(1)];// ATCmd=D6

    var b = require('bonescript');
    var sum = 0;
    var chksum  = 0;
    var data = start.concat(addr,addr16,cmdOp,atCmdin,Number(cmdData) ); 

// calculate checksum
for (var i = 3; i < data.length; i++){sum += data[i] ; }// calc sum
    sum = 0xFF & sum ;
    chksum = 0xFF - sum;// Checksum
    data.push(chksum);
 
	b.serialOpen(port, options, onSerial);
    function onSerial(x) {
        var b = require('bonescript');
		
		if (x.event == 'data') {

        if (newFrame) {
		    readings = [];
			newFrame = false;
		}
	
		setTimeout(onSerialA(x), 150);
		return;
	}
		
        if (x.err) {
            console.log('***ERROR***');
        }
        if (x.event == 'open') {
            console.log('***Damper OPENED***');
	    	b.serialWrite(port, [
                data[0] ,data[1] ,data[2] ,data[3] ,data[4] ,data[5] ,data[6] ,data[7] ,data[8] ,data[9],
                data[10],data[11],data[12],data[13],data[14],data[15],data[16],data[17],data[18],data[19] ]);
		}
    } 	
};         // end sendCmd

/***************** Serial data from Temp xBee   *******************/
function getTemp() {
	var b = require('bonescript');
    var port = '/dev/ttyO2'; // set UART port
    var options = { baudrate: 9600} ;
    b.serialOpen(port, options, onSerial);//
    return emitter;	
}; 

var readings = [];

function onSerial(x) {
    var b = require('bonescript');
		
    if (x.err) {
        console.log('***ERROR*** ' + JSON.stringify(x));
    }
    if (x.event == 'open') {
        console.log('***Temp OPENED***');
		newFrame = true;
    }
	
    if (x.event == 'data') {

        if (newFrame) {
		    readings = [];
			newFrame = false;
		}
		setTimeout(onSerialA(x), 150);
		return;
	}
};

function onSerialA(x) {
	if (readings.length < 22) {
		for (var i=0; i < x.data.length; i++) {
	        readings.push(x.data[i]);		       // push each new data chunk byte to 
                                                   // readings array			  
        }	
    }	
		else {
		    readings = [];
        };		        
					
    if (readings[0]==0x7E && readings[11] ==0x99 && readings.length == 22) {
        var adcData0 = Number(readings[20]);
        var adcData1 = 256*Number(readings[19]) ;
        var adcData = adcData1 + adcData0 ;
        var mV =  2.41833 * adcData; 
        var tempC = ((mV - 1035) + 60)/(-5.5) ;
        tempF = tempC * 1.8 + 32;                  // subtract constant for error in device
		tempF = parseFloat(tempF).toFixed(2);
		sampleNum++;
		console.log("meshDeviceDriver: sample number: " + sampleNum + " tempF: " + tempF);		
        emitter.emit('sensorDataReady', tempF);	   // emit event to tell new data	
        readings = [];		
	}	
 return;                 
}            // end on SerialA

module.exports.toggleDamper = toggleDamper;
module.exports.getTemp = getTemp;
module.exports.tempF = tempF;