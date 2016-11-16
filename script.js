var width = 1200,
    height = 700,
    active = d3.select(null);

var projection = d3.geoAlbersUsa()
    .scale(1400)
    .translate([width / 2, height / 2]);

var path = d3.geoPath()
    .projection(projection);

var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height);
    //.on("click", stopped, true);

var zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height);
    // .call(d3.zoom()
    //     .on("zoom", zoomed));
    //.on("click", reset);


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

  g.style("stroke-width", 1.5 / d3.event.scale + "px");
  g.transition().duration(750)
      .attr('transform', 'translate(' + translate + ') scale(' + scale + ')');
  d3.select('body').select('svg').select('rect').call(zoom);
}

function reset() {
  active.classed("active", false);
  active = d3.select(null);

  translate = (0,0);
  scale = 1;
  g.transition().duration(750)
      .attr('transform', 'translate(' + translate + ') scale(' + scale + ')');
}

function zoomed() {
  g.attr("transform", d3.event.transform);
  g.style("stroke-width", 1.5 / d3.event.scale + "px");
}

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
function stopped() {
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
}

function chooseData(){
  // will write this later
}
