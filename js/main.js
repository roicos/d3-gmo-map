function draw(geo_data) {
    "use strict";

    var pathToData = "./data/data.tsv";
    var yearStart = 1992;
    var yearEnd = 2016;

    // colors
    var mainColor = "#bddbdb";
    var darkText = "#8a1715";
    var mainFill = "#b73060";
    var highlightedFill = "#eb8505";
    var mainStroke = "#5b1830";
    var highlightedStroke = "#c0421a";
    var darkStroke = "#0c032e";

    // draw map

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

    // group for EU
    var EU = map.append('g')
            .attr('name', 'EU');

    map.selectAll('path')
        .data(geo_data.features)
        .enter()
        .append('path')
        .attr('name', function(d){return d.id;})
        .attr('d', path)
        .style('fill', mainColor)
        .style('stroke', darkStroke)
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
        // group EU and absent SGP
        var selector = '[name='+(countryCode == "EU" ? "DEU" : (countryCode == "SGP" ? "MYS" : countryCode.trim()))+']';

        var centroid = path.centroid(d3.select(selector).datum());

        // correction for small islands, Alaska etc.
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
            case "NOR":
                centroid[0] -=5;
                centroid[1] +=50;
            break;
        }

        return centroid;
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
                html += "<li><b>Trade name:</b> " + tradeNames[j].key;
                html += "<p><b>Developer:</b> " + tradeNames[j].values[0].developer +"</p>";
                html += "<p><b>Modifications:</b> " + tradeNames[j].values[0].gmTrait + "</p>";
                html += "<p><b>Gene sources:</b> " + tradeNames[j].values[0].geneSource + "</p>";
                html += "<a target = '_blank' title='read more'"
                      + " href = 'http://www.isaaa.org/gmapprovaldatabase/event/default.asp?EventID="
                      + tradeNames[j].values[0].id + "' class='more'></a></li>";
            }
            html += "</ol></li>";
        }
        html += "</ul>";
        return html;
    }

    function keyFunc(d){
        return d.key/* + "-" + calculateTradeNames(d)*/;
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
          .style('fill', highlightedFill)
          .style('stroke', highlightedStroke)
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
            tooltip.html(getCountryName(d) + ": " + calculateTradeNames(d) + " sorts")
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
    }

    function hideTooltip(d){
        d3.select(this)
          .style('fill', mainFill)
          .style('stroke', mainStroke)
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
                .style("height", "auto")
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

                if(d3.select(this).attr("class") != "active") {
                    info.selectAll("h5").attr("class", null);
                    d3.select(this)
                        .attr("class", "active");
                    d3.select(this.nextSibling)
                        .style("display",  "block")
                        .style("height", "auto");
                } else {
                    d3.select(this)
                        .attr("class", null);
                    d3.select(this.nextSibling)
                        .style("display",  "none")
                        .style("height", 0);
                }
            });

            var close = d3.select(".close");
            close.on("click", hideInfo);
    }

    function hideInfo(d){
        info.transition()
            .duration(500)
            .style("opacity", 0)
            .style("height", 0);
    }

    // controls

    function addCropControl(crops){
        var cropControl = d3.select("#controls")
                                   .append("div")
                                   .attr("class", "dropdown crop-control");

        cropControl.append("button")
                          .attr("class", "btn btn-default dropdown-toggle btn-sm")
                          .attr("data-toggle", "dropdown")
                          .html("All <span class='caret'></span>");

        cropControl.append("ul")
                   .attr("class", "dropdown-menu scrollable-menu")
                   .attr("role", "menu");

        cropControl.select("ul").append("li")
                           .attr("role", "presentation")
                           .html("All");

        for(var i = 0; i < crops.length; i++){
            cropControl.select("ul").append("li")
                       .attr("role", "presentation")
                       .html(crops[i]);
        }

        return cropControl;
    }

    function addYearControl(){

        var years = [];
        for(var i=yearStart; i<=yearEnd; i++){
            years.push(i);
        }

        var yearControlHtml = d3.select("#controls").append("input")
          .attr("class", "year-control")
          .attr("type", "text")
          .attr("data-slider-id", "year-slider")
          .attr("data-slider-min", yearStart)
          .attr("data-slider-max", yearEnd)
          .attr("data-slider-step", 1)
          .attr("data-slider-value", yearEnd)
          .style("opacity", 0);

        var yearControlSlider = new Slider('.year-control', {});

        return yearControlSlider;
    }

    // data

    d3.tsv(pathToData, function(error, data) {

        var dataNested;
        var dataFiltered;
        var circles;

        var cropsList = getCropsList(data);

        var cropControl;
        var yearControl;

        function update(year, crop) {

            // console.log(year);
            // console.log(crop);

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

            // remove circles not present in new dataset
            circles.exit().remove();

            // new circles
            circles.enter()
                    .append("circle")
                    .attr('cx', function(d) { return getCentroid(d.key)[0]; })
                    .attr('cy', function(d) { return getCentroid(d.key)[1];})
                    .style('fill', mainFill)
                    .style('stroke', mainStroke);

            // update all circles
            circles.transition()
                   .duration(500)
                   .attr('r', function(d) {return calculateRadius(calculateTradeNames(d)); });
            }

            function addControls() {

                var year = yearEnd, crop = null;
                var yearWrapper = d3.select(".year-wrapper");

                var controlsWrapper = d3.select("body")
                                    .append("div")
                                    .attr("id", "controls")
                                    .style("opacity", 0);

                controlsWrapper.append("p")
                               .attr("class", "crops-header")
                               .html("Crop");

                cropControl = addCropControl(cropsList);
                cropControl.selectAll("li")
                           .on("click", function(){
                                crop = d3.select(this).html();
                                cropControl.select("button").html(crop + " <span class='caret'></span>");
                                if(crop == "All") {
                                    crop = null;
                                }
                                update(year, crop);
                           });

                yearControl = addYearControl();
                yearControl.on("change", function(){
                                year = yearControl.getValue();
                                yearWrapper.html(year);
                                update(year, crop);
                            });

                d3.select("#controls").append("p")
                    .attr("class", "year-header")
                    .html("Year");

                controlsWrapper.transition()
                               .duration(200)
                               .style("opacity", .9);
            }


        // animation

        var year = yearStart;
        var yearWrapper = d3.select("body")
                            .append("div")
                            .attr("class", "year-wrapper");
        var interval = setInterval(function() {
            yearWrapper.html(year);
            update(year, null);
            year++;

            if(year > yearEnd) {
                clearInterval(interval);
                circles.on("mouseover", showTooltip)
                       .on("mouseout", hideTooltip)
                       .on("click", showInfo);
                addControls();
            }
        }, 1000);
    });
};