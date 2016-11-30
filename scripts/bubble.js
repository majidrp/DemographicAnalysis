var globalArray = [{"id":"0", "value":65},{"id":"1", "value":20},{"id":"2", "value":75},{"id":"3", "value":3},{"id":"4", "value":40},{"id":"5", "value":13},{"id":"6", "value":94},{"id":"7", "value":83},{"id":"8", "value":50},{"id":"9", "value":87}];
console.log(globalArray);

function BubbleChart(year)
{
  margin = {"left":20, "right": 25, "top":10, "bottom":30};
  var bubbles = null;
  var nodes = [];
  var window_width = window.innerWidth;
  var height = 500;
  var width = 1200;//window_width - 400;
  var width = width - margin.left - margin.right;
  var height = height - margin.top - margin.bottom;

  var x_scale = d3.scaleLinear()
                 .domain([0, 100])
                 .range([margin.left, width - margin.right])
                 .nice();
  xScale = x_scale;
  var xAxis = d3.axisBottom(xScale);

  d3.select("#dist-plot").attr("width", width).attr("height", height);

  d3.select("#dist-plot").append("svg").attr("width", width).attr("height", height).attr("id","bubble-chart");

  var svg = d3.select("#bubble-chart");


  svg.append("g").classed("axis", true).attr("transform", "translate(" + 0 + "," + (height - margin.bottom) + ")").call(xAxis);

  svg.select("axis").selectAll("text").style("fill", "#fff");

  var forceStrength = 0.05;
  var svg = document.getElementById("#bubble-chart");
  var midHeight = (height - margin.top + margin.bottom)/2;

  function Charge(d)
  {
    return -Math.pow(d.radius, 2.1) * forceStrength;
  }

  // Returns the value of d.x
  // "nodeYearPos" in his code
  function Pos_X(d)
  {
    return globalArray[d.id]["value"];
  }


  var simulation = d3.forceSimulation()
                     .velocityDecay(0.2)
                     .force('x', d3.forceX().strength(forceStrength).x(xScale(Pos_X)))
                     .force('y', d3.forceY().strength(forceStrength).y(midHeight))
                     .force("charge", d3.forceManyBody().strength(Charge))
                     .on("tick", ticked);

  simulation.stop();

  function createNodes()
  {
    var maxVal = d3.max(globalArray, function(d) {return d["value"];});
    var maxVal = maxVal * 1.1;
    var radiusScale = d3.scalePow()
                        .exponent(0.75)
                        .range([10, 50])
                        .domain([0, maxVal]);

    var myNodes = globalArray.map(function(d) {
      return{
        id: d.id,
        radius: radiusScale(+d.value),
        value: +d.value,
        x: xScale(Math.random() * 100),
        y: Math.random() * 700
      };
    });

    myNodes.sort(function(a,b) {return b.value - a.value});

    return myNodes;
  }

  // Supposed to run the simulation to get the values for the forces
  // Though it fails in returning the correct values for 'x' and
  // does not work if you try to use 'xScale' with 'Pos_X' to scale the
  // correct x position
  function MoveBubbles()
  {
    simulation.force('x', d3.forceX().strength(forceStrength).x(Pos_X));
    simulation.alpha(1).restart();
  }


  /*
   * Main entry point to the bubble chart. This function is returned
   * by the parent closure. It prepares the rawData for visualization
   * and adds an svg element to the provided selector and starts the
   * visualization creation process.
   *
   * selector is expected to be a DOM element or CSS selector that
   * points to the parent element of the bubble chart. Inside this
   * element, the code will add the SVG continer for the visualization.
   *
   * rawData is expected to be an array of data objects as provided by
   * a d3 loading function like d3.csv.
   */
  var chart = function chart() {
    // convert raw data into nodes data
    var nodes = createNodes(globalArray);

    // Create a SVG element inside the provided selector
    // with desired size.
    svg = d3.select("#bubble-chart");

    // Bind nodes data to what will become DOM elements to represent them.
    bubbles = svg.selectAll('.bubble')
                 .data(nodes, function (d) { return d.id; });

    // Create new circle elements each with class `bubble`.
    // There will be one circle.bubble for each object in the nodes array.
    // Initially, their radius (r attribute) will be 0.
    // @v4 Selections are immutable, so lets capture the
    //  enter selection to apply our transtition to below.
    var bubblesE = bubbles.enter().append("circle")
                          .classed("bubble", true)
                          .attr('r', 0)
                          .attr('fill', "#fff")
                          .attr('stroke', "#000")
                          .attr('stroke-width', 2);

    // @v4 Merge the original empty selection and the enter selection
    bubbles = bubbles.merge(bubblesE);

    // Fancy transition to make bubbles appear, ending with the
    // correct radius
    bubbles.transition()
           .duration(2000)
           .attr('r', function (d) { return d.radius; });

    // Set the simulation's nodes to our newly created nodes array.
    // @v4 Once we set the nodes, the simulation will start running automatically!
    simulation.nodes(nodes);

    MoveBubbles();
  };

  /*
   * Callback function that is called after every tick of the
   * force simulation.
   * Here we do the acutal repositioning of the SVG circles
   * based on the current x and y values of their bound node data.
   * These x and y values are modified by the force simulation.
   */
  function ticked()
   {
      bubbles.attr('cx', function (d) { return d.x; })
             .attr('cy', function (d) { return d.y; });
   }

  //var state_ids = Object.keys(states_data[year]);

  chart();
}
