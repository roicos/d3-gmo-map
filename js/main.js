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

    // helpers

    function getCentroid(countryCode){
        var selector = '[name~='+countryCode.trim()+']';
        var centroid = path.centroid(d3.select(selector).datum());
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

        var dataFiltered = dataNested.filter(function(value){return value.key == "1997"});

        console.log(dataFiltered[0].values);

        // year --> countryCode --> crop --> tradeName --> leaves(name, geneSource, gmTrait etc.)

        // functions:
        // countTradeNames(crop, country, year),
        // countCrops(country, year),

        svg.append("g")
            .attr("class", "data")
            .selectAll("circle")
            .data(dataFiltered[0].values)
            .enter()
            .append("circle")
            .attr('cx', function(d) { return getCentroid(d.key)[0]; })  // TODO: EU must be in the center of DEU, centroids are not in the center
            .attr('cy', function(d) { return getCentroid(d.key)[1];})
            .style('fill', '#8aa26e')
            .style('stroke', '#244e04')
            .attr("r", 0)
            .transition()
            .attr('r', function(d) { return d.values.length * 3; });


        // http://stackoverflow.com/questions/25881186/d3-fill-shape-with-image-using-pattern  - how to implement icons
        // http://stackoverflow.com/questions/25524906/how-to-make-an-image-round-in-d3-js - the same
    });
};