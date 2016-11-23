var percent_width = 0.7;
var states_data = [];
var counties_data = [];

Array.prototype.insert = function (index, item) {
  this.splice(index, 0, item);
};

//var DATA_BASE_DIR = "/DemographicAnalysis/Data/"; // Use this value for hosting on GitHub
var DATA_BASE_DIR = "/Data/" // For "local" hosting
var us_json_file = DATA_BASE_DIR + "us.json";

var mapSVG = document.getElementById("#map");

var window_width = window.innerWidth;

var width = 1400,//window_width * percent_width,
    height = 750,
    active = d3.select(null);

var projection = d3.geoAlbersUsa()
    .scale(width)
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
    .attr("height", height)
    .on("click", reset);

var g = svg.append("g");

d3.json(us_json_file, function(error, us)
{
   g.append("g")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
    .attr("d", path)
    .attr("class", "county-boundary")
    .attr("id", function(d){return d.id})
    .on("click", reset);

   g.append("g")
    //.attr("id", "states")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.states).features)
    .enter().append("path")
    .attr("d", path)
    .attr("class", "state")
    .attr("id", function(d){return d.id*1000})
    .on("click", clicked);

   g.append("path")
    .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
    .attr("id", "state-borders")
    .attr("d", path);
});

function clicked(d)
{
  if(active.node() === this)
    {return reset();}

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
  g.transition().duration(1300)
                .attr('transform', 'translate(' + translate + ') scale(' + scale + ')');
  d3.select('body').select('svg').select('rect').call(zoom);
}

function reset()
{
  active.classed("active", false);
  active = d3.select(null);

  translate = (0,0);
  scale = 1;
  g.transition().duration(1300)
                .attr('transform', 'translate(' + translate + ') scale(' + scale + ')');
}

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
function stopped()
{
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
}

function UpdateData()
{
  var year = parseInt(d3.select("#year-slider").property("value"));
  var genValues = d3.selectAll('input[class="gen_checkbox"]:checked').nodes();
  var eduValues = d3.selectAll('input[class="edu_checkbox"]:checked').nodes();
  var raceValues = d3.selectAll('input[class="race_checkbox"]:checked').nodes();
  var marValues = d3.selectAll('input[class="mar_checkbox"]:checked').nodes();
  var ages = d3.select("#age-slider").property("value").split(",");

  // Gets the range of ages from the slider
  if(ages[0] == ages[1])
  {
    ages.pop();
  }
  else
  {
    if(ages[1] != "65+")
    {
      ages[0] = '' + parseInt(ages[0]);
      ages[1] = '' + parseInt(ages[1]);
      var diff = parseInt(ages[1]) - parseInt(ages[0]);
    }
    else
    {
      ages[0] = '' + parseInt(ages[0]);
      var diff = 65 - parseInt(ages[0]);
    }
    for(var i = 1; i < diff; i++)
    {
      var val = parseInt(ages[0]) + i
      ages.insert(i, '' + val);
    }
  }

  // Gets an array of the values in the checkboxes
  for(var i = 0; i < genValues.length; i++)
  {
    genValues[i] = genValues[i].value;
  }

  for(var i = 0; i < eduValues.length; i++)
  {
    eduValues[i] = eduValues[i].value;
  }

  for(var i = 0; i < raceValues.length; i++)
  {
    raceValues[i] = raceValues[i].value;
  }

  for(var i = 0; i < marValues.length; i++)
  {
    marValues[i] = marValues[i].value;
  }

  // Calls the appropriate functions for the check boxes
  BubbleChart(year, ages, genValues, eduValues, raceValues, marValues);
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
