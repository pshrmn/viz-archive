queue()
  .defer(d3.json, "./data/us.json")
  .defer(d3.json, "./data/roster.json")
  .await(function(error, states, roster) {
    if ( error !== null ) {
      console.error(error);
      return;
    }

    // create the svg and projection
    var margin = {top: 15, right: 15, bottom: 15, left: 15};
    var width = 1200;
    var height = 800;
    var scale = 1400;
    var projection = d3.geo.albersUsa()
      .scale(scale)
      .translate([width/2, height/2]);
    var path = d3.geo.path()
      .projection(projection);

    var svg = d3.select("#content").append("svg")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // draw the map
    var stateData = topojson.feature(states, states.objects.states).features;
    var states = svg.append("g")
      .classed("country", true)
      .selectAll("g.state")
          .data(stateData)
        .enter().append("g")
          .classed("state", true)
          .append("path")
            .classed("outline", true)
            .attr("d", path);

    // draw the player locations
    var locs = roster.coords.map(function(spot) {
      return projection(spot);
    });
    svg.append("g")
      .classed({
        "team": true
      })
      .selectAll("circle.player")
          .data(locs)
        .enter().append("circle")
          .classed({
            "player": true
          })
          .attr("r", 10)
          .style("fill", "#C41E3A")
          .style("opacity", 0.15)
          .attr("transform", function(d){
            return "translate(" + d[0] + "," + d[1] + ")";
          });
  });
