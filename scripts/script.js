var percent_width = 0.7;
var states_data = [];
var counties_data = [];
var filled_array = [];
var geo_labels = {};
var color = null;
var color_array = ["#BFD3E6", "#88419D"];
var first_load = false;
var curr_year = 0;
var max_state = null;
var max_county = null;
var val_sorted = false;

Array.prototype.insert = function(index, item)
{
  this.splice(index, 0, item);
};

function NumberWithCommas(x)
{
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var DATA_BASE_DIR = "/DemographicAnalysis/Data/"; // Use this value for hosting on GitHub
//var DATA_BASE_DIR = "/Data/" // For "local" hosting
var us_json_file = DATA_BASE_DIR + "us.json";
var cities_file = DATA_BASE_DIR + "major_cities.csv";
var tags_file = DATA_BASE_DIR + "tags.csv";

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

var geo_tip = d3.tip()
                .attr("class", "d3-tip")
                .offset([-8, 0])
                .html(function(d) {

                 if(d.id < 1000)
                 {
                   var id = d.id * 1000;
                 }
                 else
                 {
                   var id = d.id;
                 }

                 if(curr_year == 0)
                 {
                   var value = "N/A";
                   var pop = "N/A";
                   var num = "N/A";
                 }
                 else
                 {
                   try
                   {
                     if(d.id < 1000)
                     {
                       var value = states_data[curr_year][id]["Value"].toFixed(2) + '%';
                       var pop = NumberWithCommas(states_data[curr_year][id]["Total"]);
                       var num = NumberWithCommas(parseInt(states_data[curr_year][id]["Value"]/100 * states_data[curr_year][id]["Total"]));
                     }
                     else
                     {
                       var value = counties_data[curr_year][id]["Value"].toFixed(2) + '%';
                       var pop = NumberWithCommas(counties_data[curr_year][id]["Total"]);
                       var num = NumberWithCommas(parseInt(counties_data[curr_year][id]["Value"]/100 * counties_data[curr_year][id]["Total"]));
                     }
                   }
                   catch(err)
                   {
                     var value = "N/A";
                     var pop = "N/A";
                     var num = "N/A";
                   }
                 }

                 var str = '<div class="state-tooltip-title">' +
                 geo_labels[id] + '</div>'
                 + '<span class=state-label-P>Percentage: </span>'
                 + '<span class=state-value-P>' + value + '</span><br/>'
                 + '<span class=state-label-P>Total Population: </span>'
                 + '<span class=state-value-P>' + pop + '</span><br/>'
                 + '<span class=state-label-P>Matching Population: </span>'
                 + '<span class=state-value-P>' + num + '</span>';
                 return str;
               });

// Here drawing the US map is done.
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

// This rectangle is added, so when the user clicks on a space which is not any part of the US map, it zooms out.
svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", reset);

svg.call(city_tip);
svg.call(geo_tip);

var g = svg.append("g");

d3.csv(tags_file, function(error, tag)
{
  for(var i = 0; i < tag.length; i++)
  {
    var temp_id = tag[i].id;
    var temp_geo = tag[i].location;
    geo_labels[temp_id] = temp_geo;
  }
});

// States, counties and cities are being created.
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
    .on("mouseover", function(d) {geo_tip.show(d);})
    .on("mouseout", function(d) {geo_tip.hide(d);})
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
    .on("mouseover", function(d) {geo_tip.show(d);})
    .on("mouseout", function(d) {geo_tip.hide(d);})
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

// This is the event that is called when the user clicks on the US map. It zooms in, and shows the counties.
function clicked(d)
{
  if(active.node() === this)
      {return reset();}

  active.style("fill-opacity", "1");
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

  g.transition().duration(1300)
                .attr('transform', 'translate(' + translate + ') scale(' + scale + ')');
  d3.select('body').select('svg').select('rect').call(zoom);
  active.style("stroke-width", "1.5px");
  active.style("fill-opacity", "0");
}

// If the user clicks on the same state that is zoomed on, or a part of the svg that is not any part of the US map, it zooms out.
function reset()
{
  active.style("stroke-width", "0.5px");
  active.style("fill-opacity", "1");
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
  var scaleFactor = 100;

  // Calculates the values for the states based on user input
  for(var yr_idx = 0; yr_idx < years.length; yr_idx++)
  {
    var year = years[yr_idx];
    state_ids = Object.keys(states_data[year]);
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
    var county_ids = Object.keys(counties_data[year]);
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

  colorMap(year);
  FirstCharts(year);

  if(first_load == false)
  {
    BubbleChart(year);
    first_load = true;
  }
  else
  {
    UpdateChart(year);
  }
}

function LoadData()
{
  var base_labels = ["Bachelors", "Divorced", "Graduate/Professional", "HS/GED", "Married", "Never Married", "No HS", "Population", "Separated", "Some College", "Widowed"];
  var other_labels = ["Geo", "State", "Asian", "Black", "Native Hawaiian and Other Paciffic Islander", "American Indian or Alaskan Native", "Other", "Total", "Two or More", "White"];
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
  stt = states_data;
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

// This function colors the US map, based the selections that the user has made. It colors both states and counties.
function colorMap(year){
  var state_array = d3.values(states_data[year]);
  var county_array = d3.values(counties_data[year]);
  max_state = d3.max(state_array, function(d){return d["Value"];});
  var min_state = d3.min(state_array, function(d) {return d["Value"];})

  color = d3.scaleLinear().clamp(true)
                .domain([min_state, max_state])
                .range(color_array);

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
            try {
                  var val2 = counties_data[year][d.id]["Value"];
                  if (val2 > -1){
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
    }
}

//This function creates the Stacked-bar-chart
function SecondCharts()
{
  //*****Bar Chart*****
  var svgBounds = d3.select("#stackBarChart").node().getBoundingClientRect();

  //selected year
  var Year = d3.select("#year-sec").node().value;
  //selected categories
  var selectedData = d3.select("#dataset").node().value;

  //all the keys for states
  state_ids = Object.keys(states_data[Year]);

  //the final array that we use for creating bar charts
  var array = [];
  //temporary arrays for keeping the data for each sub-category
  var array2 = [];
  var array3 = [];
  var array4 = [];
  var array5 = [];
  //name of the sub-categories for labeling
  var leg = [];

  //name of the states for x axis
  var states = [];
  for(var i = 0; i < state_ids.length; i++)
  {
      var state = state_ids[i];
      var name_temp = states_data[Year][state]["Geo"];
      states.push(abbreviation(name_temp));
  }

  //Compute the population of each sub-category for each state
  switch(selectedData) {
    case "gender":
        leg = ["Male", "Female"];
        for(var i = 0; i < state_ids.length; i++)
        {
            var state = state_ids[i];

            var m = states_data[Year][state]["M"];
            var f = states_data[Year][state]["F"];

            var male = female = 0;
            for(var j = 18; j < 66; j++)
            {
                if(j == 65)
                {
                    female += f["65+"]["Population"];
                    male += m["65+"]["Population"];
                    break;
                }
                female += f[j]["Population"];
                male += m[j]["Population"];
            }

            array.push(male);
            array2.push(female);
            array3.push(0);
            array4.push(0);
            array5.push(0);
        }
        var sum = [];
        for(var i = 0; i <= 50; i++)
          sum.push(array[i]);
        for(var i = 0; i <= 50; i++)
        {
          array.push(array2[i]);
          sum.push(array[i] + array2[i]);
        }
        for(var i = 0; i <= 50; i++)
        {
          array.push(array3[i]);
          sum.push(array[i] + array2[i] + array3[i]);
        }
        for(var i = 0; i <= 50; i++)
        {
          array.push(array4[i]);
          sum.push(array[i] + array2[i] + array3[i] + array4[i]);
        }
        for(var i = 0; i <= 50; i++)
        {
          array.push(array5[i]);
          sum.push(array[i] + array2[i] + array3[i] + array4[i] + array5[i]);
        }
        break;

    case "age":
        leg = ["18-29", "30-39", "40-49", "50-59", "60-65+"];
        for(var i = 0; i < state_ids.length; i++)
        {
            var state = state_ids[i];

            var f = states_data[Year][state]["F"];
            var m = states_data[Year][state]["M"];

            var twenty = thirty = fourty = fifty = sixty = 0;
            for(var j = 18; j < 66; j++)
            {
                if(j == 65)
                {
                    sixty += f["65+"]["Population"] + m["65+"]["Population"];
                    break;
                }
                if(j < 30)
                    twenty += f[j]["Population"] + m[j]["Population"];
                else  if(j < 40)
                        thirty += f[j]["Population"] + m[j]["Population"];
                      else  if(j < 50)
                              fourty += f[j]["Population"] + m[j]["Population"];
                            else  if(j < 60)
                                    fifty += f[j]["Population"] + m[j]["Population"];
                                  else
                                    sixty += f[j]["Population"] + m[j]["Population"];
            }

            array.push(twenty);
            array2.push(thirty);
            array3.push(fourty);
            array4.push(fifty);
            array5.push(sixty);
        }
        var sum = [];
        for(var i = 0; i <= 50; i++)
          sum.push(array[i]);
        for(var i = 0; i <= 50; i++)
        {
          array.push(array2[i]);
          sum.push(array[i] + array2[i]);
        }
        for(var i = 0; i <= 50; i++)
        {
          array.push(array3[i]);
          sum.push(array[i] + array2[i] + array3[i]);
        }
        for(var i = 0; i <= 50; i++)
        {
          array.push(array4[i]);
          sum.push(array[i] + array2[i] + array3[i] + array4[i]);
        }
        for(var i = 0; i <= 50; i++)
        {
          array.push(array5[i]);
          sum.push(array[i] + array2[i] + array3[i] + array4[i] + array5[i]);
        }
        break;

    case "edu":
        leg = ["No High School", "High School/GED", "Some College", "Bachelor's", "Graduate/Professional"];
        for(var i = 0; i < state_ids.length; i++)
        {
            var state = state_ids[i];

            var f = states_data[Year][state]["F"];
            var m = states_data[Year][state]["M"];

            var bach = grad = hs = nohs = coll = 0;
            for(var j = 18; j < 66; j++)
            {
                if(j == 65)
                {
                    var total1 = f["65+"]["Population"];
                    var total2 = m["65+"]["Population"];
                    bach += f["65+"]["Bachelors"] + m["65+"]["Bachelors"];
                    grad += f["65+"]["Graduate/Professional"] + m["65+"]["Graduate/Professional"];
                    hs += f["65+"]["HS/GED"] + m["65+"]["HS/GED"];
                    nohs += f["65+"]["No HS"] + m["65+"]["No HS"];
                    coll += f["65+"]["Some College"] + m["65+"]["Some College"];
                    break;
                }
                var total1 = f[j]["Population"];
                var total2 = m[j]["Population"];
                bach += f[j]["Bachelors"] * total1 + m[j]["Bachelors"] * total2;
                grad += f[j]["Graduate/Professional"] * total1 + m[j]["Graduate/Professional"] * total2;
                hs += f[j]["HS/GED"] * total1 + m[j]["HS/GED"] * total2;
                nohs += f[j]["No HS"] * total1 + m[j]["No HS"] * total2;
                coll += f[j]["Some College"] * total1 + m[j]["Some College"] * total2;
            }

            array.push(nohs);
            array2.push(hs);
            array3.push(coll);
            array4.push(bach);
            array5.push(grad);
        }
        var sum = [];
        for(var i = 0; i <= 50; i++)
          sum.push(array[i]);
        for(var i = 0; i <= 50; i++)
        {
          array.push(array2[i]);
          sum.push(array[i] + array2[i]);
        }
        for(var i = 0; i <= 50; i++)
        {
          array.push(array3[i]);
          sum.push(array[i] + array2[i] + array3[i]);
        }
        for(var i = 0; i <= 50; i++)
        {
          array.push(array4[i]);
          sum.push(array[i] + array2[i] + array3[i] + array4[i]);
        }
        for(var i = 0; i <= 50; i++)
        {
          array.push(array5[i]);
          sum.push(array[i] + array2[i] + array3[i] + array4[i] + array5[i]);
        }
        break;

    case "race":
        leg = ["White", "Black", "Asian", "Other Races", "Two or more Races"];
        for(var i = 0; i < state_ids.length; i++)
        {
            var state = state_ids[i];
            var total = states_data[Year][state]["Total"];
            var info = states_data[Year][state];

            var asian, black, other, white, two;

            asian = info["Asian"] * total;
            black = info["Black"] * total;
            other = info["Other"] * total + info["Native Hawaiian and Other Paciffic Islander"] * total;
            white = info["White"] * total;
            two = info["Two or More"] * total;

            array.push(white);
            array2.push(black);
            array3.push(asian);
            array4.push(other);
            array5.push(two);
        }
        var sum = [];
        for(var i = 0; i <= 50; i++)
          sum.push(array[i]);
        for(var i = 0; i <= 50; i++)
        {
          array.push(array2[i]);
          sum.push(array[i] + array2[i]);
        }
        for(var i = 0; i <= 50; i++)
        {
          array.push(array3[i]);
          sum.push(array[i] + array2[i] + array3[i]);
        }
        for(var i = 0; i <= 50; i++)
        {
          array.push(array4[i]);
          sum.push(array[i] + array2[i] + array3[i] + array4[i]);
        }
        for(var i = 0; i <= 50; i++)
        {
          array.push(array5[i]);
          sum.push(array[i] + array2[i] + array3[i] + array4[i] + array5[i]);
        }
        break;

    case "marital":
        leg = ["Married", "Seperated", "Widowed", "Divorced", "Never Married"];
        for(var i = 0; i < state_ids.length; i++)
        {
            var state = state_ids[i];

            var f = states_data[Year][state]["F"];
            var m = states_data[Year][state]["M"];

            var div = mar = nomar = sep = wid = 0;
            for(var j = 18; j < 66; j++)
            {
                if(j == 65)
                {
                    var total1 = f["65+"]["Population"];
                    var total2 = m["65+"]["Population"];
                    div += f["65+"]["Divorced"] * total1 + m["65+"]["Divorced"] * total2;
                    mar += f["65+"]["Married"] * total1 + m["65+"]["Married"] * total2;
                    nomar += f["65+"]["Never Married"] * total1 + m["65+"]["Never Married"] * total2;
                    sep += f["65+"]["Separated"] * total1+ m["65+"]["Separated"] * total2;
                    wid += f["65+"]["Widowed"] * total1 + m["65+"]["Widowed"] * total2;
                    break;
                }
                var total1 = f[j]["Population"];
                var total2 = m[j]["Population"];
                div += f[j]["Divorced"] * total1 + m[j]["Divorced"] * total2;
                mar += f[j]["Married"] * total1 + m[j]["Married"] * total2;
                nomar += f[j]["Never Married"] * total1 + m[j]["Never Married"] * total2;
                sep += f[j]["Separated"] * total1 + m[j]["Separated"] * total2;
                wid += f[j]["Widowed"] * total1 + m[j]["Widowed"] * total2;
            }

            array.push(mar);
            array2.push(sep);
            array3.push(wid);
            array4.push(div);
            array5.push(nomar);
        }
        var sum = [];
        for(var i = 0; i <= 50; i++)
          sum.push(array[i]);
        for(var i = 0; i <= 50; i++)
        {
          array.push(array2[i]);
          sum.push(array[i] + array2[i]);
        }
        for(var i = 0; i <= 50; i++)
        {
          array.push(array3[i]);
          sum.push(array[i] + array2[i] + array3[i]);
        }
        for(var i = 0; i <= 50; i++)
        {
          array.push(array4[i]);
          sum.push(array[i] + array2[i] + array3[i] + array4[i]);
        }
        for(var i = 0; i <= 50; i++)
        {
          array.push(array5[i]);
          sum.push(array[i] + array2[i] + array3[i] + array4[i] + array5[i]);
        }
  }

  //round them and divides them by 1,000,000
  for(var i = 0; i < sum.length; i++)
  {
    sum[i] = Math.round(sum[i]/1000000);
    array[i] = Math.round(array[i]/1000000);
  }

  //**********************************************
  //svgbounds
  var width = window.innerWidth - margin.left - margin.right - 200;
  var height = 400 - margin.bottom - margin.top;

  var svgBounds = d3.select("#stackBarChart")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom + 200)

  var max = d3.max(sum, function(d) { return d; });

  //Create x axis and y axis
  var x = d3.scaleBand().rangeRound([0, width]).paddingInner(0.05);
  var y = d3.scaleLinear()
      .range([height, 0])
      .domain([0, max]);
  var coloring = d3.scaleLinear()
      .range(["#a58ec4", "#bfadd8", "#992288", "#441188", "#bbdddd"])
      .domain([1, 2, 3, 4, 5]);

  var xAxis = d3.axisBottom(x);
  var yAxis = d3.axisLeft(y);

  x.domain(states.map(function(d) { return d; }));
  y.domain([0, max]);

  //Append the axes
  var xxx = d3.selectAll("#xAxis3")
    .classed("axis", true)
    .attr("transform", "translate(" + margin.left + "," + (height+10) + ")")
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", "-.55em")
    .attr("transform", "rotate(-90)" );

  var yyy = d3.selectAll("#yAxis3")
    .classed("axis", true)
    .attr("transform", "translate(" + margin.left + ",10)")
    .call(yAxis);

  yyy.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x",0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font", "16px sans-serif")
    .text("Population (million)");

  //Create the bars
  array = array.reverse();
  sum = sum.reverse();
  states = states.reverse();
  var bars = d3.select("#stackBarChart").selectAll("rect")
      .data(array);
  bars.exit().remove();
  bars = bars.enter().append("rect").merge(bars);

  bars.attr("transform", "translate(" + margin.left + ",10)")
      .attr("x", function(d, i) { return x(states[i%51]); })
      .attr("width", x.bandwidth())
      .transition().duration(3000)
      .style("fill", function(d, i) {
          if(i < 51)
            return coloring(1);
          else  if(i < 102)
                  return coloring(2);
                else  if(i < 153)
                        return coloring(3);
                      else  if(i < 204)
                              return coloring(4);
                            else
                              return coloring(5);
       })
      .attr("height", function(d, i) { return height - y(sum[i]); })
      .attr("y", function(d, i) {
          return y(sum[i]);
      })
      .attr("opacity", 1);


  //Create Labels
  var col = d3.scaleOrdinal()
    .range(["#bbdddd", "#441188", "#992288", "#bfadd8", "#a58ec4"]);
    col.domain(leg);

  temp = [];
  var legend = d3.select("#stackBarChart").selectAll(".legend")
      .data(temp);

  legend.exit().remove();

  legend = legend.enter().append("g").merge(legend)
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
      .style("font", "16px sans-serif");

  legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", col);

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".70em")
      .attr("text-anchor", "end")
      .attr("fill", "white")
      .text(function(d) { return d; });

  var legend = d3.select("#stackBarChart").selectAll(".legend")
      .data(leg.reverse());

  legend.exit().remove();

  legend = legend.enter().append("g").merge(legend)
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
      .style("font", "16px sans-serif");

  legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", col);

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".70em")
      .attr("text-anchor", "end")
      .attr("fill", "white")
      .text(function(d) { return d; });
}


function FirstCharts(curr_year)
{
  var char1_width = window.innerWidth - margin.left - margin.right;
  var char1_height = 400 - margin.bottom - margin.top;


  //*****Bar Chart*****
  var svgBounds = d3.select("#barChart")
                    .attr("width", char1_width)
                    .attr("height", char1_height + margin.bottom + margin.top)
                    //.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  // selection values
  var state_array = d3.values(states_data[curr_year]);
  state_array.pop();

  var bar_values = state_array.map(function(d){
                               var population = (+d["Value"]/100) * (+d["Total"]);
                               return{
                                "state":d["Geo"],
                                "id":abbreviation(d["Geo"]),
                                "pop":population,
                                "per":(+d["Value"])
                               }});

   bar_values = bar_values.sort(function(a, b) {return d3.descending(b.id, a.id)});

   var bar_tip = d3.tip()
                   .attr("class", "d3-tip")
                   .offset([-8, 0])
                   .html(function(d) {
                       var rem = (+d.per) % 1;
                       if(rem > 0.001 && (+d.per) != 0)
                       {
                         var value = Math.min(Math.ceil(Math.abs(Math.log10(+d.per))) + 1, 2);
                         value = (+d.per).toFixed(value) + '%';
                       }
                       else
                       {
                         var value = (+d.per).toFixed(2) + '%';
                       }
                       var pop = NumberWithCommas(parseInt(d.pop));
                       var str = '<div class="state-tooltip-title">' +
                       d.state + '</div>'
                       + '<span class=state-label-P>Percentage: </span>'
                       + '<span class=state-value-P>' + value + '</span><br/>'
                       + '<span class=state-label-P>Matching Population: </span>'
                       + '<span class=state-value-P>' + pop + '</span>';
                       return str;
                     });

  var svg = d3.select("#barChart");
  svg.call(bar_tip);

  var min = d3.min(bar_values, function(d) { return d.per; });
  var max = d3.max(bar_values, function(d) { return d.per; });

  //******************************************************

  // Create the x and y scales

  var x = d3.scaleBand().rangeRound([0, char1_width - margin.right - margin.left])
                        .paddingInner(0.10)
                        .domain(bar_values.map(function(d) {return d.id;}));
  var y = d3.scaleLinear().range([char1_height - margin.top, 0])
                          .domain([0, max * 1.1])
                          .nice();


  var xAxis = d3.axisBottom(x);
  var yAxis = d3.axisLeft(y)
                .tickFormat(function(d) {
                  var rem = d % 1;
                  if (rem > 0.0001)
                  {
                    var temp = Math.ceil(Math.abs(Math.log10(rem))) + 1;
                    return d.toFixed(temp) + '%';
                  }
                  else
                  {
                    return d + '%';
                  }});

  // Create the axes
  var xxx = d3.selectAll("#xAxis1")
              .classed("axis", true)
              .attr("transform", "translate(" + margin.left + "," + char1_height + ")")
              .transition().duration(1000)
              .call(xAxis)
              .selectAll("text")
              .style("text-anchor", "end")
              .attr("dx", "-.8em")
              .attr("dy", "-.3em")
              .attr("transform", "rotate(-90)" );

  var yyy = d3.selectAll("#yAxis1")
              .classed("axis", true)
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
              .transition().duration(1000)
              .call(yAxis);

  // Create the bars
  var bars = d3.select("#barChart").selectAll("rect").data(bar_values);

  bars.exit().remove();
  bars = bars.enter()
             .append("rect")
             .merge(bars);

  bars.attr("transform", "translate(" + margin.left + ",0)")
      .attr("x", function(d)
                  {
                    return x(d.id);
                  })
      .attr("width", x.bandwidth())
      .classed("bars", true)
      .on("mouseover", function(d) {bar_tip.show(d)})
      .on("mouseout", function(d) {bar_tip.hide(d)})
            .attr("opacity", 1)
      .transition().duration(1000)
      .attr("y", function(d) {return y(d.per)})
      .style("fill", function(d)
                      {
                        return color(d.per);
                      })
      .attr("height", function(d)
                      {
                        return char1_height - y(d.per);
                      });

   var names = d3.select("#xAxis1").selectAll("text").on("click", SortName)
                                                     .on("mouseover", function(d) {
                                                       d3.select(this).style("cursor", "pointer");
                                                     })
                                                     .on("mouseout", function(d) {
                                                       d3.select(this).style("cursor", "default")
                                                     });
   var vals = d3.select("#yAxis1").selectAll("text").on("click", SortValue)
                                                    .on("mouseover", function(d) {
                                                       d3.select(this).style("cursor", "pointer");
                                                     })
                                                     .on("mouseout", function(d) {
                                                       d3.select(this).style("cursor", "default")
                                                     });

   var temp_bars = bar_values;

   function SortName()
   {
     var bar_values = temp_bars.sort(function(a, b) {return d3.descending(b.id, a.id)});
     var x0 = x.domain(bar_values.map(function(d) {return d.id;})).copy();

     svg.selectAll(".bars").sort(function(a, b) {return x0(b.id) - x0(a.id)});

     var transition = svg.transition().duration(750),
              delay = function(d, i) {return i * 50};

     transition.selectAll(".bars")
               .delay(delay)
               .attr("x", function(d) {return x0(d.id);});

     transition.select("#xAxis1").call(xAxis).selectAll("g").delay(delay);

     temp_bars = bar_values;
   }

   function SortValue()
   {
     var bar_values_v = temp_bars.sort(function(a,b) {return b.per - a.per});

     var x0 = x.domain(bar_values_v.map(function(d) {return d.id;})).copy();

     svg.selectAll(".bars").sort(function(a, b) {return x0(b.id) - x0(a.id)});

     var transition = svg.transition().duration(750),
              delay = function(d, i) {return i * 50};

     transition.selectAll(".bars")
               .delay(delay)
               .attr("x", function(d) {return x0(d.id);});

     transition.select("#xAxis1").call(xAxis).selectAll("g").delay(delay);

     temp_bars = bar_values_v;
   }
}

function abbreviation(input)
{
  var states = {
        'Arizona':'AZ',
        'Alabama':'AL',
        'Alaska':'AK',
        'Arizona':'AZ',
        'Arkansas':'AR',
        'California':'CA',
        'Colorado':'CO',
        'Connecticut':'CT',
        'Delaware':'DE',
        'District of Columbia':'DC',
        'Florida':'FL',
        'Georgia':'GA',
        'Hawaii':'HI',
        'Idaho':'ID',
        'Illinois':'IL',
        'Indiana':'IN',
        'Iowa':'IA',
        'Kansas':'KS',
        'Kentucky':'KY',
        'Kentucky':'KY',
        'Louisiana':'LA',
        'Maine':'ME',
        'Maryland':'MD',
        'Massachusetts':'MA',
        'Michigan':'MI',
        'Minnesota':'MN',
        'Mississippi':'MS',
        'Missouri':'MO',
        'Montana':'MT',
        'Nebraska':'NE',
        'Nevada':'NV',
        'New Hampshire':'NH',
        'New Jersey':'NJ',
        'New Mexico':'NM',
        'New York':'NY',
        'North Carolina':'NC',
        'North Dakota':'ND',
        'Ohio':'OH',
        'Oklahoma':'OK',
        'Oregon':'OR',
        'Pennsylvania':'PA',
        'Rhode Island':'RI',
        'South Carolina':'SC',
        'South Dakota':'SD',
        'Tennessee':'TN',
        'Texas':'TX',
        'Utah':'UT',
        'Vermont':'VT',
        'Virginia':'VA',
        'Washington':'WA',
        'West Virginia':'WV',
        'Wisconsin':'WI',
        'Wyoming':'WY',
  };
  return states[input];
}
