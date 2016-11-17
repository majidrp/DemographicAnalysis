var percent_width = 0.75;
var percent_height = 0.90;
var states_data = [];
var counties_data = [];

//var DATA_BASE_DIR = "/DemographicAnalysis/Data/"; // Use this value for hosting on GitHub
var DATA_BASE_DIR = "/Data/" // For "local" hosting


var mapSVG = document.getElementById("#map");

var window_width = window.innerWidth;
var window_height = window.innerHeight;

var width = window_width * percent_width,
    height = window_height * percent_height,
    active = d3.select(null);

var projection = d3.geoAlbersUsa()
    .scale(window_width * .9)
    .translate([width / 2, height / 2]);

var path = d3.geoPath()
    .projection(projection);

var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height);

var zoom = d3.zoom()
    .scaleExtent([1, 8]);

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height);

var g = svg.append("g");

us_json_file = DATA_BASE_DIR + "us.json";
d3.json(us_json_file, function(error, us)
  {
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

function clicked(d)
{
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

function reset()
{
  active.classed("active", false);
  active = d3.select(null);

  translate = (0,0);
  scale = 1;
  g.transition().duration(750)
      .attr('transform', 'translate(' + translate + ') scale(' + scale + ')');
}

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
function stopped()
{
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
}

function chooseData()
{

}

function LoadData()
{
  var base_labels = ["Bachelors", "Divorced", "Graduate/Professional", "HS/GED", "Married", "Never Married", "No HS", "Population", "Separated", "Some College", "Widowed"];
  var other_labels = ["Geo", "State", "Asian", "Black", "Native Hawaiian and Other Paciffic Islander", "Other", "Total", "Two or More", "White"];
  var ages = [];
  var years = ["2010", "2011", "2012", "2013", "2014", "2015"];
  var geo_ = ["States", "Counties"];
  var genders = ["M", "F"];

  // Create a list of ages {18, 19, 20,...,63, 64, 65+}
  for(var i = 18; i <= 65; i++)
  {
    if(i == 65)
    {
      ages.push(i + '+');
    }
    else
    {
      ages.push(i + '');
    }
  }

  var BASE_DIR = DATA_BASE_DIR + geo_[0] + "/";
  var FILE_EXT = "_ACS.csv";

  ReadStates(BASE_DIR, FILE_EXT, years, geo_, genders, ages, base_labels, other_labels);

  BASE_DIR = DATA_BASE_DIR + geo_[1] + "/";
  ReadCounties(BASE_DIR, FILE_EXT, years, geo_, genders, ages, base_labels, other_labels);
}

function ReadStates(BASE_DIR, FILE_EXT, years, geo_, genders, ages, base_labels, other_labels)
{
  var year_data = []
  for(var yr = 0; yr < years.length; yr++)
  {
    var csv_file = BASE_DIR + years[yr] + FILE_EXT;
    var temp = 0
    d3.csv(csv_file, function(d)
    {
      var geo_data = [];
      for(var ind = 0; ind < d.length; ind++)
      {

        var local_geo = parseInt(d[ind].id);
        var gen_data = [];
        for(var gen = 0; gen < genders.length; gen++)
        {
          var age_data = [];
          for(var i = 0; i < ages.length; i++)
          {
            var label_data = [];
            for(var j = 0; j < base_labels.length; j++)
            {
              var csv_key = ages[i] + "_" + genders[gen] + "_" + base_labels[j];
              label_data[base_labels[j]] = +d[ind][csv_key];
            }
            age_data[ages[i]] = label_data;
          }
          gen_data[genders[gen]] = age_data;
        }
        geo_data[local_geo] = gen_data;

        // Other labels for region done here
        for(var i = 0; i < other_labels.length; i++)
        {
          if(i == 0 || i == 1)
          {
            geo_data[local_geo][other_labels[i]] = d[ind][other_labels[i]];
          }
          else
          {
            geo_data[local_geo][other_labels[i]] = +d[ind][other_labels[i]];
          }
        }
      }
      year_data[years[temp]] = geo_data;
      temp = temp + 1;
    });
  }
  states_data = year_data;
}

function ReadCounties(BASE_DIR, FILE_EXT, years, geo_, genders, ages, base_labels, other_labels)
{
  var year_data = []
  for(var yr = 0; yr < years.length; yr++)
  {
    var csv_file = BASE_DIR + years[yr] + FILE_EXT;
    var temp = 0
    d3.csv(csv_file, function(d)
    {
      var geo_data = [];
      for(var ind = 0; ind < d.length; ind++)
      {
        var local_geo = parseInt(d[ind].id);
        var gen_data = [];
        for(var gen = 0; gen < genders.length; gen++)
        {
          var age_data = [];
          for(var i = 0; i < ages.length; i++)
          {
            var label_data = [];
            for(var j = 0; j < base_labels.length; j++)
            {
              var csv_key = ages[i] + "_" + genders[gen] + "_" + base_labels[j];
              label_data[base_labels[j]] = +d[ind][csv_key];
            }
            age_data[ages[i]] = label_data;
          }
          gen_data[genders[gen]] = age_data;
        }
        geo_data[local_geo] = gen_data;

        // Other labels for region done here
        for(var i = 0; i < other_labels.length; i++)
        {
          if(i == 0 || i == 1)
          {
            geo_data[local_geo][other_labels[i]] = d[ind][other_labels[i]];
          }
          else
          {
            geo_data[local_geo][other_labels[i]] = +d[ind][other_labels[i]];
          }
        }
      }
      year_data[years[temp]] = geo_data;
      temp = temp + 1;
    });
  }
  counties_data = year_data;
}
