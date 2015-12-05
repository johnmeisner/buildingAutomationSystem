'use strict';

var myChartAppModule = angular.module('myChartApp', ['ui.chart'])

    .value('charting', {
	    lineChartOptions: {
		    title: 'Room 1 Temperature Chart (&degF)',
//			showMarker: false,
//			grid: {borderWidth:9.0},
			series: [{showMarker: false, lineWidth: 3.0  }],
			axesDefaults: {
			    labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
//			    tickRenderer: $.jqplot.LineAxisTickRenderer,
				tickOptions: {
				    fontFamily: 'Georgia',
					fontSize: '10pt',
//					angle: -30
				}
			},
			axes: {
			    xaxis: {
//				    pad: 80,
				    min: 0,
				    label: 'Sample Number',
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
//					renderer:$.jqplot.CategoryAxisRenderer,
					fontFamily: 'Georgia, Serif'
				},
				yaxis: {
				    min: 60,
					max: 80,
//				    label: 'Temperature (F)',
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
//					renderer:$.jqplot.CategoryAxisRenderer,
					fontFamily: 'Georgia, Serif',
//					angle: -90
				}
			},
		    seriesDefaults: {
//			    renderer: $.jqplot.LineRenderer,
				rendererOptions: {
				    showDataLabels: true
				}
		    },
//			legend: {show: true}
//			legend: {show: false}
		}
	})   
	
	.controller('DemoCtrl', function($scope, charting){
	    $scope.someData = [[
		[1, 70.4],
		[2, 70.5],
		[3, 70.3],
		[4, 70.55],
		[20, 70.1]
		]];
		$scope.myChartOpts = charting.lineChartOptions;
	});    
//alert("module myChartApp Loaded");
	