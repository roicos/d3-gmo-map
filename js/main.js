function draw(geo_data) {
    "use strict";

    var pathToData = "./data/data.tsv";

    // map
    // TODO: function drawMap

    var margin = 75;
    var width = 1400 - margin;
    var height = 600 - margin;

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

    function getYearsList(){
        var years = [];
        for(var i = 1992; i <= 2016; i ++) {
                    years.push(i);
        }
        return years;
    }

    function getCropsList(data){
        var nested = d3.nest()
                       .key(function(d) { return d.crop; })
                       .sortKeys(d3.ascending)
                       .map(data, d3.map);

        return d3.keys(nested["_"]);
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

    function getCountryName(d){
        return d.values[0].values[0].values[0].country;
    }

    function calculateCrops(d){
        return d.values.length;
    }

    function getCrops(d){
        return d.values;
    }

    function calculateTradeNames(d){
        var counter = 0;
        for (var i=0; i<d.values.length; i++){
            counter += d.values[i].values.length;
        }
        return counter;
    }

    function getTradeNamesListHTML(d){
        var crops = getCrops(d);
        var html = "<ul class='crops'>";
        for (var i = 0; i<crops.length; i++){
            var tradeNames = crops[i].values;
            html += "<li><h5>" + crops[i].key + ": " + tradeNames.length + " sorts</h5>";
            html += "<ol class='trade-names'>"
            for(var j=0; j<tradeNames.length; j++){
                html += "<li><p><b>Trade name:</b> " + tradeNames[j].key + "</p>";
                html += "<p><b>Developer:</b> " + tradeNames[j].values[0].developer +"</p>";
                html += "<p><b>Modifications:</b> " + tradeNames[j].values[0].gmTrait + "</p>";
                html += "<p><b>Gene sources:</b> " + tradeNames[j].values[0].geneSource + "</p>";
                html += "<a herf = 'http://www.isaaa.org/gmapprovaldatabase/event/default.asp?EventID='" + tradeNames[j].values[0].id + " class='more'>read more</a></li>";
            }
            html += "</ol></li>";
        }
        html += "</ul>";
        return html;
    }

    function keyFunc(d){
        return d.key + "-" + calculateTradeNames(d);
    }

    function calculateRadius(cropsCount){
        return Math.sqrt(cropsCount) * 2;
    }

    // Tooltip

    var tooltip = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);


    function showTooltip(d){
        d3.select(this)
          .style('stroke', '#b91343')
          .style('stroke-width', '3');
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
            tooltip.html(getCountryName(d) + ": " + calculateTradeNames(d) + " sorts")
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
    }

    function hideTooltip(d){
        d3.select(this)
          .style('stroke', '#244e04')
          .style('stroke-width', '1');
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    }

    // Info

    var info = d3.select("body").append("div")
                     .attr("class", "info")
                     .style("opacity", 0);

    function showInfo(d){
             hideTooltip(d);
            info.transition()
            .duration(200)
            .style("opacity", .9);

            info.html("<div class='close'></div><h4>"
            + getCountryName(d) + ": " + calculateCrops(d)
            + " crops</h4>" + getTradeNamesListHTML(d));

            info.selectAll(".trade-names")
                .style("display", "none")
                .style("height", 0);
            info.selectAll("h5").on("click", function(){
                d3.selectAll(".trade-names")
                .style("display", "none")
                .style("height", 0);
                d3.select(this.nextSibling)
                .style("display",  "block")
                .style("height", "auto");
            });

            var close = d3.select(".close");
            close.on("click", hideInfo);
    }

    function hideInfo(d){
        info.transition()
            .duration(500)
            .style("opacity", 0);
    }

    // controls

    function addCropControl(crops){
        var cropControl = d3.select("body").append("ul")
          .attr("class", "crop-control")
          .style("opacity", 0);

        for(var i = 0; i < crops.length; i++){
            cropControl.append("li")
                       .html(crops[i]);
        }

        cropControl.transition()
                   .duration(200)
                   .style("opacity", .9);
    }

    function addYearControl(years){
        var cropControl = d3.select("body").append("ul")
          .attr("class", "crop-control")
          .style("opacity", 0);

        for(var i = 0; i < years.length; i++){
            cropControl.append("li")
                       .html(years[i]);
        }

        cropControl.transition()
                   .duration(200)
                   .style("opacity", .9);
    }

    // data

    d3.tsv(pathToData, function(error, data) {

        var dataNested;
        var dataFiltered;
        var circles;
        var cropsList = getCropsList(data);
        var years = getYearsList();

        function addControls() {
            addCropControl(cropsList)
            addYearControl(years);
        }

        function update(year, crop) {

            console.log(year);
            console.log(crop);

            dataFiltered = data.filter(function(d) {
                  return calculateYear(d) <= year && (crop != null ? d.crop == crop : true);
            });

            dataNested = d3.nest()
                         .key(function(d) { return d.countryCode; })
                         .key(function(d) { return d.crop; })
                         .key(function(d) { return d.tradeName; })
                         .entries(dataFiltered);

            circles = svg.selectAll("circle")
                      .data(dataNested, keyFunc);

            circles.exit().remove();

            circles.enter()
                    .append("circle")
                    .transition()
                    .duration(500)
                    .attr('cx', function(d) { return getCentroid(d.key)[0]; })
                    .attr('cy', function(d) { return getCentroid(d.key)[1];})
                    .style('fill', '#8aa26e')
                    .style('stroke', '#244e04')
                    .attr("r", 0)  // TODO: remember old data and change radius from old to new
                    .transition()
                    .attr('r', function(d) {return calculateRadius(calculateTradeNames(d)); });

            circles.on("mouseover", showTooltip)
                   .on("mouseout", hideTooltip)
                   .on("click", showInfo);
            }


        // animation
        // TODO: function startAnimation
        var year_idx = 0;

        var year_interval = setInterval(function() {
            update(years[year_idx], null);
            year_idx++;

            if(year_idx >= years.length) {
                clearInterval(year_interval);
                addControls();
            }
        }, 1000);
    });
};