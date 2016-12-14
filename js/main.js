function draw(geo_data) {
	"use strict";
	
	var pathToData = "./data/data.tsv";
	var pathToCountryCenroids = "./data/country_centroids_all.csv";
	var pathToCountryCodes = "./data/country_codes.csv";
	
	// map 
	
	var margin = 75,
		width = 1400 - margin,
		height = 600 - margin;

	var svg = d3.select("body")
		.append("svg")
		.attr("width", width + margin)
		.attr("height", height + margin)
		.append('g')
		.attr('class', 'map');
	
	var projection = d3.geo.mercator()
                     .scale(150)
                     .translate( [width / 2, height / 1.5]);

	var path = d3.geo.path().projection(projection);

	var map = svg.selectAll('path')
				 .data(geo_data.features)
				 .enter()
				 .append('path')
				 .attr('d', path)
				 .style('fill', '#f6f8e0')
				 .style('stroke', '#3c4b52')
				 .style('stroke-width', 0.5);
	
	// data
	
	
	
	d3.tsv(pathToData, function(erEvents, dEvents) {
		//console.log("erEvents: " + erEvents);
		/*for(var key in dEvents[0]){
			console.log(key);
			console.log(dEvents[0][key]);
		}*/
		d3.csv(pathToCountryCodes, function(erCodes, dCodes) {
		 // console.log("erCodes " + erCodes);
		 // console.log("dCodes: " + dCodes[0]);
		  d3.csv(pathToCountryCenroids, function(erCentroids, dCentroids) {
			//console.log("erCentroids: " + erCentroids);
			//console.log("dCentroids: " + dCentroids[0]);
			for(var key in dEvents[0]){
				console.log(key);
				console.log(dEvents[0][key]);
			}
			// в центре каждой страны - иконки одобренных культур (рисунок - в зависимости от crop), размер - в зависимости от количетсва видов crop
		  });
		});
	});
};