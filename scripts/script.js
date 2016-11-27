var percent_width = 0.7;
var states_data = [];
var counties_data = [];
var filled_array = [];
var color = null;
var color_array = ["#fbb702", "#BF1F00"];
var first_load = false;
var curr_year = 0;
var max_state = null;
var max_county = null;

Array.prototype.insert = function(index, item)
{
  this.splice(index, 0, item);
};

function NumberWithCommas(x)
{
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

//var DATA_BASE_DIR = "/DemographicAnalysis/Data/"; // Use this value for hosting on GitHub
var DATA_BASE_DIR = "/Data/" // For "local" hosting
var us_json_file = DATA_BASE_DIR + "us.json";
var cities_file = DATA_BASE_DIR + "major_cities.csv";

var mapSVG = document.getElementById("#map");

var window_width = window.innerWidth;
var width_map = window_width - 400;

if(width_map < 400)
{
  width_map = 1400;
}

var width = width_map,//window_width * percent_width,
    height = 750,
    active = d3.select(null);

var city_tip = d3.tip()
                 .attr("class", "d3-tip-cities")
                 .offset([-8, 0])
                 .html(function(d) { return d["city"]; });

var state_tip = d3.tip()
               .attr("class", "d3-tip")
               .offset([-8, 0])
               .html(function(d) {
                 if(curr_year == 0)
                 {
                   var value = "N/A";
                   var pop = "N/A";
                   var num = "N/A";
                 }
                 else
                 {
                   var value = states_data[curr_year][d.id * 1000]["Value"].toFixed(2) + '%';
                   var pop = NumberWithCommas(states_data[curr_year][d.id * 1000]["Total"]);
                   var num = NumberWithCommas(parseInt(states_data[curr_year][d.id * 1000]["Value"]/100 * states_data[curr_year][d.id * 1000]["Total"]));
                 }
                 var str = '<div class="state-tooltip-title">' +
                 states_data[2015][d.id * 1000]["Geo"] + '</div>'
                 + '<span class=state-label-P>Percentage: </span>'
                 + '<span class=state-value-P>' + value + '</span><br/>'
                 + '<span class=state-label-P>Total Population: </span>'
                 + '<span class=state-value-P>' + pop + '</span><br/>'
                 + '<span class=state-label-P>Matching Population: </span>'
                 + '<span class=state-value-P>' + num + '</span>';
                 return str;
               });


var county_tip = d3.tip()
              .attr("class", "d3-tip")
              .offset([-8, 0])
              .html(function(d) {
                if(curr_year == 0)
                {
                  var value = "N/A";
                  var pop = "N/A";
                  var num = "N/A";
                }
                else
                {
                  var value = counties_data[curr_year][d.id]["Value"].toFixed(2) + '%';
                  var pop = NumberWithCommas(counties_data[curr_year][d.id]["Total"]);
                  var num = NumberWithCommas(parseInt(counties_data[curr_year][d.id]["Value"]/100 * counties_data[curr_year][d.id]["Total"]));
                }
                var str = '<div class="county-tooltip-title">' +
                counties_data[2015][d.id * 1000]["Geo"] + '</div>'
                + '<span class=county-label-P>Percentage: </span>'
                + '<span class=county-value-P>' + value + '</span><br/>'
                + '<span class=county-label-P>Total Population: </span>'
                + '<span class=county-value-P>' + pop + '</span><br/>'
                + '<span class=county-label-P>Matching Population: </span>'
                + '<span class=county-value-P>' + num + '</span>';
                return str;
              });

var projection = d3.geoAlbersUsa()
    .scale(Math.min(window_width - 100, 1500))
    .translate([width / 2, height / 2]);

var path = d3.geoPath()
    .projection(projection);

var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height)
  .attr("id", "us_map")
  .style("border-radius", "10px");

var zoom = d3.zoom()
    .scaleExtent([1, 8]);

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", reset);

svg.call(city_tip);
svg.call(state_tip);
svg.call(county_tip);

var g = svg.append("g");

d3.json(us_json_file, function(error, us)
{
   g.append("g")
    .attr("id", "countyg")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
    .attr("d", path)
    .attr("class", "county-boundary")
    .attr("id", function(d){return d.id})
    .on("click", reset)
    .on("mouseover", function(d) {county_tip.show(d);})
    .on("mouseout", function(d) {county_tip.hide(d);})
    .on("contextmenu", function (d, i) {
        d3.event.preventDefault();});

   g.append("g")
    .attr("id", "stateg")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.states).features)
    .enter().append("path")
    .attr("d", path)
    .attr("class", "state")
    .attr("id", function(d){return d.id * 1000;})
    .on("click", clicked)
    .on("mouseover", function(d) {state_tip.show(d);})
    .on("mouseout", function(d) {state_tip.hide(d);})
    .on("contextmenu", function (d, i) {
        d3.event.preventDefault();
        if(filled_array[d.id * 1000] == true && curr_year != 0)
        {
          d3.select(this).style("fill", "transparent");
          filled_array[d.id * 1000] = false;
        }
        else
        {
          if(curr_year == 0)
          {

          }
          else
          {
            d3.select(this).style("fill", color(states_data[curr_year][d.id * 1000]["Value"]));
            filled_array[d.id * 1000] = true;
          }
        }
    });

    d3.csv(cities_file, function(error, city)
    {
      d3.select("#stateg")
        .selectAll(".cities").data(city).enter()
        .append("circle")
        .attr("id", function(d) {return d["city"];})
        .attr("r", 0)
        .attr("cx", function(d){
            var loc = [+d["lon"], +d["lat"]];
            return projection(loc)[0];
        })
       .attr("cy", function(d){
            var loc = [+d["lon"], +d["lat"]];
            return projection(loc)[1];
       })
       .attr("class", "cities")
       .on("mouseover", function(d) {city_tip.show(d);})
       .on("mouseout", function(d) {city_tip.hide(d);})
       .on("contextmenu", function (d, i) {
          d3.event.preventDefault();
       });});

   g.append("path")
    .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
    .attr("id", "state-borders")
    .attr("d", path)
    .on("contextmenu", function (d, i) {
        d3.event.preventDefault();
    });
});

function clicked(d)
{
  if(active.node() === this)
      {return reset();}

  active.style("stroke-width", "0.5px");
  active.classed("active", false);
  active = d3.select(this).classed("active", true);

  var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
      translate = [width / 2 - scale * x, height / 2 - scale * y];

  //g.style("stroke-width", 1.5 / d3.event.scale + "px");
  g.transition().duration(1300)
                .attr('transform', 'translate(' + translate + ') scale(' + scale + ')');
  d3.select('body').select('svg').select('rect').call(zoom);
  active.style("stroke-width", "1.5px");
}

function reset()
{
  active.style("stroke-width", "0.5px");
  active.classed("active", false);
  active = d3.select(null);

  translate = (0,0);
  scale = 1;
  g.transition().duration(1300)
                .attr('transform', 'translate(' + translate + ') scale(' + scale + ')');
}

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
// function stopped()
// {
//   if (d3.event.defaultPrevented) d3.event.stopPropagation();
// }

function CalculatePopulation(ages, genValues, eduValues, raceValues, marValues)
{
  var years = Object.keys(states_data);
  var state_ids = Object.keys(states_data[years[0]]);
  var county_ids = Object.keys(counties_data[years[0]]);
  var scaleFactor = 100;

  // Calculates the values for the states based on user input
  for(var yr_idx = 0; yr_idx < years.length; yr_idx++)
  {
    var year = years[yr_idx];
    for(var st_idx = 0; st_idx < state_ids.length; st_idx++)
    {
      var state = state_ids[st_idx];
      var pop_total = states_data[year][state]["Total"];
      var value = 0;

      if(raceValues.length == 0)
      {
        var race_sum = 1.0;
      }
      else
      {
        var race_sum = 0.0;
      }

      for(var rc_idx = 0; rc_idx < raceValues.length; rc_idx++)
      {
        var race = raceValues[rc_idx];
        race_sum = race_sum + states_data[year][state][race];
      }

      for(var gn_idx = 0; gn_idx < genValues.length; gn_idx++)
      {
        var gender = genValues[gn_idx];
        for(var ag_idx = 0; ag_idx < ages.length; ag_idx++)
        {
          var age = ages[ag_idx];
          var per_pop = states_data[year][state][gender][age]["Population"];
          per_pop = per_pop / pop_total;

          if(eduValues.length == 0 && marValues.length == 0)
          {
            var edu_sum = 1.0;
            var mar_sum = 1.0;
          }
          else if(eduValues.length == 0)
          {
            var edu_sum = 1.0;
            var mar_sum = 0;
          }
          else if(marValues.length == 0)
          {
            var edu_sum = 0;
            var mar_sum = 1.0;
          }
          else
          {
            var edu_sum = 0;
            var mar_sum = 0;
          }

          for(var ed_idx = 0; ed_idx < eduValues.length; ed_idx++)
          {
            var edu = eduValues[ed_idx];
            edu_sum = edu_sum + states_data[year][state][gender][age][edu];
          }

          for(var ma_idx = 0; ma_idx < marValues.length; ma_idx++)
          {
            var mar = marValues[ma_idx];
            mar_sum = mar_sum + states_data[year][state][gender][age][mar];
          }
          value = value + per_pop * edu_sum * mar_sum;
        }
      }
      states_data[year][state]["Value"] = Math.round(race_sum * value * scaleFactor * 100)/100;
    }
  }

  // Calculates the values for the counties based on user input
  for(var yr_idx = 0; yr_idx < years.length; yr_idx++)
  {
    var year = years[yr_idx];
    for(var cty_idx = 0; cty_idx < county_ids.length; cty_idx++)
    {
      var county = county_ids[cty_idx];
      var pop_total = counties_data[year][county]["Total"];

      var value = 0;

      if(raceValues.length == 0)
      {
        var race_sum = 1.0;
      }
      else
      {
        var race_sum = 0.0;
      }

      for(var rc_idx = 0; rc_idx < raceValues.length; rc_idx++)
      {
        var race = raceValues[rc_idx];
        race_sum = race_sum + counties_data[year][county][race];
      }

      for(var gn_idx = 0; gn_idx < genValues.length; gn_idx++)
      {
        var gender = genValues[gn_idx];
        for(var ag_idx = 0; ag_idx < ages.length; ag_idx++)
        {
          var age = ages[ag_idx];
          var per_pop = counties_data[year][county][gender][age]["Population"];
          per_pop = per_pop / pop_total;

          if(eduValues.length == 0 && marValues.length == 0)
          {
            var edu_sum = 1.0;
            var mar_sum = 1.0;
          }
          else if(eduValues.length == 0)
          {
            var edu_sum = 1.0;
            var mar_sum = 0;
          }
          else if(marValues.length == 0)
          {
            var edu_sum = 0;
            var mar_sum = 1.0;
          }
          else
          {
            var edu_sum = 0;
            var mar_sum = 0;
          }

          for(var ed_idx = 0; ed_idx < eduValues.length; ed_idx++)
          {
            var edu = eduValues[ed_idx];
            edu_sum = edu_sum + counties_data[year][county][gender][age][edu];
          }

          for(var ma_idx = 0; ma_idx < marValues.length; ma_idx++)
          {
            var mar = marValues[ma_idx];
            mar_sum = mar_sum + counties_data[year][county][gender][age][mar];
          }
          value = value + per_pop * edu_sum * mar_sum;
        }
      }

      if(pop_total > 0)
      {
        counties_data[year][county]["Value"] = Math.round(race_sum * value * scaleFactor * 100)/100;
      }
      else
      {
        counties_data[year][county]["Value"] = -1;
      }

    }
  }
}

function UpdateData()
{
  var year = parseInt(d3.select("#year-slider").property("value"));
  var genValues = d3.selectAll('input[class="gen_checkbox"]:checked').nodes();
  var eduValues = d3.selectAll('input[class="edu_checkbox"]:checked').nodes();
  var raceValues = d3.selectAll('input[class="race_checkbox"]:checked').nodes();
  var marValues = d3.selectAll('input[class="mar_checkbox"]:checked').nodes();
  var ages = d3.select("#age-slider").property("value").split(",");

  curr_year = year;

  // Gets the range of ages from the slider
  if(ages[0] == ages[1])
  {
    ages.pop();
  }
  else
  {
    if(ages[1] != "65.00")
    {
      ages[0] = '' + parseInt(ages[0]);
      ages[1] = '' + parseInt(ages[1]);
      var diff = parseInt(ages[1]) - parseInt(ages[0]);
    }
    else
    {
      ages[0] = '' + parseInt(ages[0]);
      ages[1] = "65+";
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

  if(genValues.length == 0)
  {
    genValues = ["M", "F"];
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
  CalculatePopulation(ages, genValues, eduValues, raceValues, marValues);
  //console.log(states_data[2015][1000]["Value"]);
  colorMap(year);
  //BubbleChart(year);
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

          filled_array[local_geo] = true;
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

function colorMap(year){

  var state_array = d3.values(states_data[year]);
  var county_array = d3.values(counties_data[year]);
  max_state = d3.max(state_array, function(d){return d["Value"];});
  max_county = d3.max(county_array, function(d){return d["Value"];});
  var max_val = Math.max(max_state, max_county);

  color = d3.scaleLinear().clamp(true)
                .domain([0, max_val])
                .range(color_array);
                //.range(["rgb(237,248,233)","rgb(186,228,179)","rgb(116,196,118)","rgb(49,163,84)","rgb(0,109,44)"]); //green, Alex's Tutorial

    d3.select("#stateg").selectAll("path")
        .transition().duration(1500)
        .style("fill", function(d){
            if(d.id >= 72) return "#aaa";
            var val = states_data[year][((d.id)*1000)]["Value"];
            return color(val);
        });

    d3.select("#countyg").selectAll("path")
        .transition().duration(1500)
        .style("fill", function(d){
            //console.log("id=", d.id);
            try {
                  var val2 = counties_data[year][d.id]["Value"];
                  //console.log("id=", d.id, ", val=", val2);
                  if (val2 > 0){
                    return color(val2);
                  }
                  else{
                    return "#aaa";
                  }
            }
            catch(err) {
                return "#aaa";
            }
        });

    if(first_load == false)
    {
      d3.selectAll(".cities")
        .transition().duration(1500)
        .attr("r", 3);

      first_load = true;
    }
}
