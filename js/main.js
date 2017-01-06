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

    function showTooltip(d){
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
            tooltip	.html(d.key + ": " + calculateTradeNames(d))
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
    }

    function hideTooltip(d){
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    }

    // helpers

    function getCentroid(countryCode){
        var selector = '[name='+(countryCode == "EU" ? "DEU" : (countryCode == "SGP" ? "MYS" : countryCode.trim()))+']';
        var centroid = path.centroid(d3.select(selector).datum());
        switch(countryCode){
            case "SGP":
                centroid[0] -=15;
                centroid[1] +=3;
            break;
            case "USA":
                centroid[0] +=40;
                centroid[1] +=35;
            break;
            case "CAN":
                centroid[0] -=40;
                centroid[1] +=50;
            break;
            case "KOR": //ATF
                centroid[0] +=40;
                centroid[1] -=150;
            break;
            case "NZL": // NCL
                centroid[0] +=10;
                centroid[1] +=50;
            break;
            case "NOR":
                centroid[0] -=5;
                centroid[1] +=50;
            break;
        }

        // South Korea, New Zeland, Norway
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

    function calculateCrops(d){
        return d.values.length;
    }

    function calculateTradeNames(d){
        var counter = 0;
        for (var i=0; i<d.values.length; i++){
            counter += d.values[i].values.length;
        }
        return counter;
    }

    function keyFunc(d){
        return d.key + "-" + calculateTradeNames(d);
    }

    function calculateRadius(cropsCount){
        return Math.sqrt(cropsCount) * 2;
    }

    // data

    d3.tsv(pathToData, function(error, data) {

        var dataNested;
        var dataFiltered;
        var circles;


        function update(year) {

            console.log(year);

            dataFiltered = data.filter(function(d) {
                  return calculateYear(d) <= year;
            });

            dataNested = d3.nest()
                         .key(function(d) { return d.countryCode; })
                         .key(function(d) { return d.crop; })
                         .key(function(d) { return d.tradeName; })
                         .entries(dataFiltered);

            //console.log(dataNested);

            keyFunc(dataNested[0]);

            // todo: use data(data, calculateTradeNames+country) to compare tradeNames+country, not just countries

            circles = svg.selectAll("circle")
                      .data(dataNested, keyFunc);

            circles.exit().remove();

            circles.enter()  // страны, которые добавились
                    .append("circle")
                    .transition()
                    .duration(500)
                    .attr('cx', function(d) { return getCentroid(d.key)[0]; })
                    .attr('cy', function(d) { return getCentroid(d.key)[1];})
                    .style('fill', '#8aa26e')
                    .style('stroke', '#244e04')
                    .attr("r", 0)
                    .transition()
                    .attr('r', function(d) { return calculateRadius(d.values.length); });

            circles.on("mouseover", showTooltip)
                   .on("mouseout", hideTooltip);
        }

        var years = [];

        for(var i = 1992; i < 2016; i ++) {
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

        // http://stackoverflow.com/questions/25881186/d3-fill-shape-with-image-using-pattern  - how to implement icons
        // http://stackoverflow.com/questions/25524906/how-to-make-an-image-round-in-d3-js - the same
    });
};