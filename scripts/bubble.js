var xScale = null;
var margin = null;

function DrawAxis()
{
  var svg = d3.select("#dist-plot")
  margin = {"left":10, "right": 15, "top":10, "bottom":30};
  var window_width = window.innerWidth;
  var height = 300;
  var width = window_width - 400;
  var width = width - margin.left - margin.right;
  var height = height - margin.top - margin.bottom;

  var x_scale = d3.scaleLinear()
                 .domain([0, 100])
                 .range([margin.left, width - margin.right])
                 .nice();
  xScale = x_scale;
  var xAxis = d3.axisBottom(xScale);

  svg.attr("width", width).attr("height", height);
  svg.append("g").classed("axis", true).attr("transform", "translate(" + 0 + "," + (height - margin.bottom) + ")").call(xAxis);

  svg.select("axis").selectAll("text").style("fill", "#fff");
}

function BubbleChart(year)
{
  function rescaleAxis()
  {
    xScale.domain([0, max_state]);
    var svg = d3.select("#dist-plot").selectAll("axis")
                .transition().duration(1500).ease("sin-in-out")
                .call(xScale);
  }

  rescaleAxis();


  var forceStrength = 0.03;
  var svg = document.getElementById("#dist-plot");
  var rect = svg.getBoundingClientRect();
  var height = rect.height;
  var midHeight = (height - margin.top + margin.bottom)/2;

  function charge(d)
  {
    return -Math.power(d.radius, 2.0) * forceStrength;
  }


  var simulation = d3.forceSimulation()
                     .velocityDecay(0.2)
                     .force('x', d3.forceX().strength(forceStrength).x(xScale(x)))
                     .force('y', d3.forceY().strength(forceStrength).y(midHeight))
                     .force("charge", d3.forceManyBody().strength(charge))
                     .on("tick", ticked);

  simulation.stop();

  function createNodes(rawData)
  {
    var maxVal = 100;

    var radiusScale = d3.scalePow()
                        .exponent(0.5)
                        .range([2, 50])
                        .domain([0, maxVal]);

    var myNodes = rawData.map(function(d) {
      return{
        id: d.id,
        radius: radiusScale(+d.value),
        value: +d.value,
        x: Math.random() * 1000,
        y: Math.random() * 700
      };
    });

    myNodes.sort(function(a,b) {return b.value - a.value});

    return myNodes;
  }


  //var state_ids = Object.keys(states_data[year]);

}
