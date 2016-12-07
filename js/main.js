function draw(geo_data) {
	"use strict";
	var margin = 75,
		width = 1400 - margin,
		height = 600 - margin;

	var svg = d3.select("body")
		.append("svg")
		.attr("width", width + margin)
		.attr("height", height + margin)
		.append('g')
		.attr('class', 'map');
};