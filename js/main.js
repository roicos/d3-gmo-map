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
        .attr("height", height + margin);

    var projection = d3.geo.mercator()
        .scale(150)
        .translate( [width / 2, height / 1.5]);

    var path = d3.geo.path().projection(projection);

    var map = svg.append('g')
        .attr('class', 'map')
        .selectAll('path')
        .data(geo_data.features)
        .enter()
        .append('path')
        .attr('d', path)
        .style('fill', '#f6f8e0')
        .style('stroke', '#3c4b52')
        .style('stroke-width', 0.5);


    // data



    d3.tsv(pathToData, function(erEvents, dEvents) {
        d3.csv(pathToCountryCodes, function(erCodes, dCodes) {
            // console.log("erCodes " + erCodes);
            // console.log("dCodes: " + dCodes[0]);
            d3.csv(pathToCountryCenroids, function(erCentroids, dCentroids) {
                //console.log("erCentroids: " + erCentroids);
                //console.log("dCentroids: " + dCentroids[0]);
                /*for(var key in dEvents[0]){
                console.log(key);
                console.log(dEvents[0][key]);
                }*/

                // year --> country --> crop --> leaves(name, geneSource, gmTrait etc.)

                // functions:
                // countCultivars(crop, country, year),
                // countCrops(country, year),
                // calculatePosition(centroid, cropsNum, index)

                /*svg.append('g')
                .attr("class", "crop")
                .selectAll("circle")
                .data(nested, key_func)
                .enter()
                .append("circle")
                .attr('cx', function(d) { return calculatePosition(centroid, calculateCrops(country, year), index).x; })
                .attr('cy', function(d) { return calculatePosition(centroid, calculateCrops(country, year), index).y;  })
                .attr('r', function(d) {
                    return radius(countCultivars(year, country, crop));
                });*/

                // works below:)

                var data = [
                    {key : "c", value : "30"},
                    {key : "a", value : "10"},
                    {key : "b", value : "20"},
                    {key : "d", value : "40"}
                ];

                svg.append("g")
                    .attr("class", "data")
                    .selectAll("circle")
                    .data(data)
                    .enter()
                    .append("circle")
                    .attr('cx', function(d) { return +d.value + 200; })
                    .attr('cy', function(d) { return +d.value + 300; })
                    .attr("r", 0)
                    .transition()
                    .attr('r', function(d) { return d.value; })
                    .style('fill', '#f6f8e0')
                    .style('stroke', '#3c4b52');
            });
        });
    });
};