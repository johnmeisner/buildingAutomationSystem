'use strict';

var myApp = angular.module('myApp', ['ui.chart', 'ui.slider', 'ngResource']);
var socket = io.connect();

var alias = 55,
    url = 66;
var	tempF;
var sampleNum = 0;
var damper;
var thermostatTemp;
var tempSetpt = 70;

var d = new Date();
var n = d.getTime();

myApp.controller('AppCtrl', function($scope, $rootScope){

  $scope.mappings = [];
  $scope.damperOn = 1;

  $scope.addMapping = function () {
    alias = $scope.alias,
    url = $scope.url;
    socket.emit('addMapping', { alias: tempF, url: sampleNum });
  };
  
  $scope.toggleFan = function () {
     socket.emit('toggleFan');
  };
  
  $scope.toggleDamper = function () {
     socket.emit('toggleDamper');
  }; 
  
  $scope.update = function () {
     socket.emit('update');
  };
  
  $scope.addTemp = function () {
    socket.emit('addTemp', {alias: tempF, url: sampleNum });
  };
  
  $scope.customerServiceRequest = function () {
    socket.emit('customerServiceRequest');
  };

  socket.on('list', function (documents) {
    $scope.$apply(function () {
      $scope.mappings = documents;
    });
  });
  
  socket.on('newTemp', function (tempF, damper, thermostatTemp, sampleNum) {
      $rootScope.data = tempF;
	  $rootScope.data1 = damper;
	  $rootScope.data2 = thermostatTemp;
	  $rootScope.sampleNumber = sampleNum;
      $scope.alias = tempF;
	  });

  socket.on('newMapping', function (mapping) {   
    $scope.$apply(function () {
      $scope.mappings.push(mapping);
	  $rootScope.data = $scope.alias;
    });
  }); 

   socket.on('newDamperPosition', function (damperOn) {
    if (Number(damperOn) == 1 ) {
        $scope.damperPosition = "Fully Closed";
    }
    else {
        $scope.damperPosition = "Fully Open";
    };		
    $scope.damperOn = damperOn;
  }); 
  
}); 

    myApp.value('charting', {
	    lineChartOptions: {
		    title: 'Room 1 Sensor (&degF) / Actuator / Setpoint Values ',
			series: [{showMarker: true, lineWidth: 3  }],
			axesDefaults: {
			    labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
				tickOptions: {
				    fontFamily: 'Georgia',
					fontSize: '10pt'
				}
			},
			axes: {
			    xaxis: {
//				    min: 2,
                    min: n,
				    label: 'Time',
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					fontFamily: 'Georgia, Serif',
					renderer:$.jqplot.DateAxisRenderer,
					tickOptions: { 
//					    formatString: '%b %#d, %#I %p',
                        formatString: '%H:%M:%S',
						fontFamily: 'Georgia, Serif',
//                                   fontSize:'10pt', 
//                                   fontFamily:'Tahoma', 
                                     angle:-60					
					},     
				},
				yaxis: {
				    min: 60,
					max: 90,
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					fontFamily: 'Georgia, Serif'
				}
			},
		    seriesDefaults: {
				rendererOptions: {
				    showDataLabels: true
				}
		    }
		}
	})

    myApp.controller('DemoCtrl', function($scope, $rootScope, charting){
	$scope.someData = [[], [], []];	
	socket.on('newTemp', function () {	
        $scope.$apply(function () {
//            if ($rootScope.sampleNumber < 60) {
//	$scope.someData = [[
//		[n, 79],
//        ['2015-11-28 1:00AM',60.7],
//        ['2015-11-29 1:00AM',73.7],
//		['2015-11-29 4:00PM',79.7],
//		['2015-11-29 8:00PM',69],
//		['2015-11-29 10:00PM',62],
//		['2015-12-09 12:00PM',60]
               var date = new Date();
               $scope.someData[0].push([date.getTime(), $rootScope.data]);
			   $scope.someData[1].push([date.getTime(), $rootScope.data1]);
			   $scope.someData[2].push([date.getTime(), $rootScope.data2]);
//		    };
//    ]];
        });		
		$scope.myChartOpts = charting.lineChartOptions;
	    })   	
	}); 

    myApp.controller('SetptCtrl', function($scope, $log){		
	$scope.slider = {
	'options': {
		start: function (event, ui) { $log.info('Slider start'); },
    	stop: function (event, ui) { $log.info('Slider stop'); },
		range: true
		}
	};
        socket.on('serverSetpt', function(tempSetpt) {
            $scope.tempSetpt = tempSetpt;
        });		
//		$scope.tempSetpt = 67;
//		console.log($scope.tempSetpt);
		$scope.addSetpt = function () {
        var tempSetpt = $scope.tempSetpt;
        socket.emit('newTempSetpt', tempSetpt);
       };
		
	}); 
		
	myApp.controller('WeatherController', function($scope, weatherService) {
    $scope.getWeather = function() {
    $scope.weatherDescription = "Fetching . . .";
	$scope.country = "us";
    weatherService.getWeather($scope.city, $scope.country).success(function(data) {
      $scope.weatherDescription = data.weather[0].description;
	  $scope.mainTempC = data.main.temp - 273.13;
	  var mainTempF = $scope.mainTempC * 1.8 + 32;
	  $scope.mainTemp = parseFloat(mainTempF).toFixed(1);
    }).error(function() {
      $scope.weatherDescription = "Could not obtain data";
    });
  }
});	

    myApp.factory('weatherService', function($http) {
    return {
      getWeather: function(city, country) {
        var query = 'q=' + city + ',' + country + '&' + 'APPID=' + 'f97bcd1cb2dff0efc0e8c17b0d1742eb';
      return $http.get('http://api.openweathermap.org/data/2.5/weather?' + query,{cache:false});
    }
  }
});
