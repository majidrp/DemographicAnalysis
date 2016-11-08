These folders contain the raw and clean data from the American Community
Survey (ACS) which was downloaded from http://factfinder.census.gov/

The python script `clean_data.py` pulls from the `Raw_Data` folder
(which contains the data directly from the census) and parses just the
necessary rows and columns and returns it in JSON format. Parses both `States`

It then outputs the data into the appropriate folder, named such as
`[YEAR]_ACS.json`, where `[YEAR]` is the year that the data is from. The format
of the json data is

```
geo
 |- Race -> {"White","Black","American Indian or Alaskan Native","Asian","Native Hawaiian and Other Paciffic Islander","Other","Two or More"}
 |- Total_Population
 |- Age -> {"18","19","20",...,"63","64","65+"}
     |- Gender -> {"M","F"}
          |- Population
          |- Education -> 18-24:{"No HS","HS/GED","Some College", "Bachelors"} or 25+:{"No HS","HS/GED","Some College","Bachelors","Graduate/Professional"}
          |- Marital Status -> {"Married","Widowed","Divorced","Separated","Never Married"}
```

where `geo` is the geographic location, ie state or county, and it has the
subset data as portrayed above. The values in brackets are the values that
represent those values. For example, there is no `data["Alabama"]["24"]["M"]["Education"]`
but there is `data["Alabama"]["24"]["M"]["No HS"]`. Though since there is not multiple
values for `Population` for that age range, that can be accessed by just calling
the subtype "`Population`". Aside from the population, the other attributes list
the fractional value for that age range in that category. For example, `data["Alabama"]["24"]["M"]["No HS"]`
will have a value `0.2450` for 2010, meaning that `24.5%` of the men in Alabama
that are 24 years old don't have a high school education.

The census data does not give ages for each year, rather it lists it in ranges
for some years, and as a single year for others. For example, the data for the
population was `[18-19,20,21,22-24,etc]`. To get the value of the population for
each year, we assumed an equal population in each age range. For example, Alabama
listed a population of around 70,000 for males 18-19. So when cleaning the data and
separating it for 18 and 19, we split it in 2 since there are two age ranges in it,
giving both 18 and 19 a population of 35,000. This *should* produce accurate
results since the age ranges are not too far separated and realistically should
be relatively close.
