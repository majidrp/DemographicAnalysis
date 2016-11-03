These folders contain the raw and clean data from the American Community
Survey which was downloaded from http://factfinder.census.gov/

The python script `clean_data.py` pulls from the `Raw_Data` folder
(which contains the data directly from the census) and parses just the
necessary rows and columns and returns it in JSON format. It is not
completely finished yet, as there seems to be some bugs in different years
when testing educational status (ie "S1501") over different years, though
it does work for 2005 and 2006.

After fixing the educational bug, the data will be placed in the appropriate
`Counties` and `States` folders for the "clean data."
