function draw(geo_data) {
    "use strict";

    var pathToData = "./data/data.tsv";

    // map

    var margin = 75,
    width = 1400 - margin,
    height = 600 - margin;

    var svg = d3.select("body")
        .append("svg")
        .attr("width", width + margin)
        .attr("height", height + margin);

    var projection = d3.geo.mercator()
        .scale(150)
        .translate( [width / 2, height / 1.5]);

    var path = d3.geo.path().projection(projection);

    var map = svg.append('g')
        .attr('class', 'map');

    var EU = map.append('g')
            .attr('name', 'EU');

    map.selectAll('path')
        .data(geo_data.features)
        .enter()
        .append('path')
        .attr('name', function(d){return d.id;})
        .attr('d', path)
        .style('fill', '#e4eaa2')
        .style('stroke', '#3c4b52')
        .style('stroke-width', 0.5);

    var EUCountries = ['AUT', 'BEL', 'BGR', 'HRV', 'CYP', 'CZE', 'DNK',
                        'EST', 'FIN', 'FRA', 'DEU', 'GRC', 'HUN', 'IRL',
                        'ITA', 'LVA', 'LTU', 'LUX', 'NLD', 'POL',
                        'PRT', 'ROU', 'SVK', 'SVN', 'ESP', 'SWE', 'GBR', 'NOR'];

    for (var i = 0; i < EUCountries.length; i++) {
        EU.append(function(d) {
            var selector = '[name = '+EUCountries[i]+ ' ]';
            var paths = map.select(selector).remove();
            return paths[0][0];
        });
    }


    // Tooltip

    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // helpers

    function getCentroid(countryCode){
        var selector = '[name='+(countryCode == "EU" ? "DEU" : (countryCode == "SGP" ? "MYS" : countryCode.trim()))+']';
        var centroid = path.centroid(d3.select(selector).datum());
        if(countryCode == "SGP"){
            centroid[0] -=15;
            centroid[1] +=3;
        }
        if(countryCode == "USA"){
            centroid[0] +=40;
            centroid[1] +=35;
        }
        if(countryCode == "CAN"){
            centroid[0] -=40;
            centroid[1] +=50;
        }
        return centroid;
    }

    function calculateYear(d){
        var years = [];
        if(d.food > 0){
            years.push(d.food);
        }
        if(d.feed > 0){
            years.push(d.feed);
        }
        if(d.cultivation > 0){
            years.push(d.cultivation);
        }
        return d3.min(years);
    }

    // data

    d3.tsv(pathToData, function(error, data) {

        var dataNested = d3.nest()
            .key(function(d) { return calculateYear(d); })
            .key(function(d) { return d.countryCode; })
            .key(function(d) { return d.crop; })
            .entries(data);

        var dataFiltered = dataNested.filter(function(value){return value.key == "2015"});

       // console.log(dataFiltered);

        function key_func(d) {
            return d['key'];
        }

        function showTooltip(d){
            //console.log(d.values[0].values[0].country);
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
                tooltip	.html(d.values[0].values[0].country + ": " + d.values.length)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        }

        function hideTooltip(d){
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        }

        svg.append("g")
            .attr("class", "data")
            .selectAll("circle")
           // .data(dataFiltered, key_func)
            .data(dataFiltered[0].values)
            .enter()
            .append("circle")
            .attr('cx', function(d) { return getCentroid(d.key)[0]; })
            .attr('cy', function(d) { return getCentroid(d.key)[1];})
            .style('fill', '#8aa26e')
            .style('stroke', '#244e04')
            .on("mouseover", showTooltip)
            .on("mouseout", hideTooltip)
            .attr("r", 0)
            .transition()
            .attr('r', function(d) { return d.values.length * 3; });

// TODO: animation: summ crops for all years

            function update(year) {
                dataFiltered = dataNested.filter(function(d) {
                  return d['key'] == year;
            });

            var circles = svg.selectAll('circle')
                                .data(dataFiltered[0].values);

            circles.exit().remove();
            circles.enter()
                    .append("circle")
                    .transition()
                    .duration(500)
                    .attr('cx', function(d) { console.log(d); return getCentroid(d.key)[0]; })
                    .attr('cy', function(d) { return getCentroid(d.key)[1];})
                    .attr('r', function(d) { return d.values.length * 3; });
            }

            var years = [];

            for(var i = 1992; i < 2017; i ++) {
                years.push(i);
            }

            var year_idx = 0;

            var year_interval = setInterval(function() {
                update(years[year_idx]);
                year_idx++;

                if(year_idx >= years.length) {
                    clearInterval(year_interval);
                }
            }, 1000);

        // year --> countryCode --> crop --> tradeName --> leaves(name, geneSource, gmTrait etc.)

                // functions:
                // countTradeNames(crop, country, year),
                // countCrops(country, year),

        // http://stackoverflow.com/questions/25881186/d3-fill-shape-with-image-using-pattern  - how to implement icons
        // http://stackoverflow.com/questions/25524906/how-to-make-an-image-round-in-d3-js - the same
    });
};