function BubbleChart(year)
{
  var svg = d3.select("#dist-plot")
  var margin = {"left":10, "right": 10, "top":10, "bottom":10};
  var height = 300;
  var width = 800;
  var width = width - margin.left - margin.right;
  var height = height - margin.top - margin.bottom;

  svg.attr("width", width).attr("height", height);

}
