var width = 960,
    height = 500,
    active = d3.select(null);

var projection = d3.geoAlbersUsa()
    .scale(1000)
    .translate([width / 2, height / 2]);

var path = d3.geoPath()
    .projection(projection);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .on("click", stopped, true);

// svg.call(d3.zoom()
//     .scaleExtent([1, 8])
//     .on("zoom", zoomed));

var zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

svg
    .call(zoom); // delete this line to disable free zooming
    //.call(zoom.event);

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", reset);

var g = svg.append("g");

d3.json("/Data/us.json", function(error, us) {
  if (error) throw error;

  g.selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
    .enter().append("path")
      .attr("d", path)
      .attr("class", "feature")
      .on("click", clicked);

  g.append("path")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .attr("class", "mesh")
      .attr("d", path);
});

function clicked(d) {
  //console.log("clicked()");
  if (active.node() === this) return reset();
  active.classed("active", false);
  active = d3.select(this).classed("active", true);

  var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
      translate = [width / 2 - scale * x, height / 2 - scale * y];

  svg.transition()
      .duration(750)
      .call(zoom.transform, transform);

  function transform() {
    //console.log("transform()");
    return d3.zoomIdentity
        .translate(translate)
        .scale(scale);
  }
}

function reset() {
  //console.log("reset()");
  active.classed("active", false);
  active = d3.select(null);

  // svg.transition()
  //     .duration(750)
  //     .call(zoom.translate([0, 0]).scale(1).event);
}

function zoomed() {
  //console.log("zoomed()");
  g.style("stroke-width", 1.5 / d3.event.scale + "px");
  //g.attr("transform", d3.event.transform);
  //g.attr("transform", d3.event.scale);
  //g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  //g.attr("transform", "translate(" + d3.event.translate + ")");
  //g.attr("scale(" + d3.event.scale + ")");
}

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
function stopped() {
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
}
