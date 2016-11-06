from __future__ import print_function, division
import csv
import os
from decimal import *

def ReadEntries_AgeSex(tag):
    data = []
    entriesFile = os.getcwd() + "/Entries/" + tag + "_Entries.dat"
    lines = [line.rstrip('\n') for line in open(entriesFile)]
    data = lines[0:4]
    lines = lines[5:]
    for i in range(0, len(lines)):
        if(i%2 == 0):
            data.append(lines[i])
    return data

def ReadEntries(tag):
    data = []
    entriesFile = os.getcwd() + "/Entries/" + tag + "_Entries.dat"
    lines = [line.rstrip('\n') for line in open(entriesFile)]
    for i in range(0, len(lines)):
        data.append(lines[i])
    return data

def Read_AgeSex(filename, entries):
    data = {}
    with open(filename) as csvFile:
        next(csvFile, None) # Skips first line
        next(csvFile, None) # Skips second line
        lineRead = csv.reader(csvFile, delimiter=',')
        for item in lineRead:
            local_data = {}
            entry_shift = 9
            for i in range(0, len(item)):
                if i <= 4:
                    if i == 0 or i == 2:
                        local_data[entries[i]] = item[i]
                    elif i == 4:
                        local_data[entries[i]] = int(item[i+1])
                    else:
                        local_data[entries[i]] = int(item[i])
                elif i%2 == 1:
                    if i >= 15:
                        local_data[entries[entry_shift]] = int(item[i])
                        entry_shift = entry_shift + 1
            data[local_data["Geography"]] = local_data
        return data

def ReadData(filename, entries, m_list, f_list, edu=False):
    data = {}
    if edu == True:
        m_NoHS = [47,53,59,65,71,77,83]
        f_NoHS = [49,55,61,67,73,79,85]
        m_add = 41
        f_add = 43
    getcontext().prec = 6
    with open(filename) as csvFile:
        next(csvFile, None) # Skips the first line
        next(csvFile, None) # Skips the seoncd line
        lineRead = csv.reader(csvFile, delimiter=',')
        for item in lineRead:
            local_data = {}
            for i in m_list:
                if edu == True:
                    if i == m_add:
                        total = 0.0
                        for j in m_NoHS:
                            total = total + float(item[j])
                        total = str(Decimal(total)/Decimal(100.0))
                        local_data[entries[i]] = total
                    else:
                        if item[2] == "Alabama":
                            print(i, item[i], entries[i])
                        total = str(Decimal(item[i])/Decimal(100.0))
                        local_data[entries[i]] = total
                else:
                    total = str(Decimal(item[i])/Decimal(100.0))
                    local_data[entries[i]] = total
            for i in f_list:
                if edu == True:
                    if i == f_add:
                        total = 0.0
                        for j in f_NoHS:
                            total = total + float(item[j])
                        total = str(Decimal(total)/Decimal(100.0))
                        local_data[entries[i]] = total
                    else:
                        total = str(Decimal(item[i])/Decimal(100.0))
                        local_data[entries[i]] = total
                else:
                    total = str(Decimal(item[i])/Decimal(100.0))
                    local_data[entries[i]] = total
            data[item[2]] = local_data
    return data

def ReadData_Race(filename, entries, tags):
    data = {}
    getcontext().prec = 6
    with open(filename) as csvFile:
        next(csvFile, None) # Skips the first line
        next(csvFile, None) # Skips the seoncd line
        lineRead = csv.reader(csvFile, delimiter=',')
        for item in lineRead:
            local_data = {}
            total = 0
            for i in tags:
                if total == 0:
                    total = Decimal(float(item[i]))
                    continue
                val = Decimal(float(item[i]))
                val = val/total
                local_data[entries[i]] = str(val)
            data[item[2]] = local_data
    return data

year = "05"
BASE_DIR = os.getcwd() + "/Raw_Data/States/20" + year + "_ACS/"
end = "_with_ann.csv"
FT = ""
if year == "05" or year == "06":
    FT = "_EST_"
else:
    FT = "_1YR_"

tag = "B01001"
currFile = BASE_DIR + "ACS_" + year + FT + tag + end
entries = ReadEntries_AgeSex(tag)
ageData = Read_AgeSex(currFile, entries)

tag = "S1501"
m_list = [11,17,23,29,41,89,113,119,131]
f_list = [13,19,25,31,43,95,115,121,133]
currFile = BASE_DIR + "ACS_" + year + FT + tag + end
entries = ReadEntries(tag)
eduData = ReadData(currFile, entries, m_list, f_list, True)
print(currFile)
print(eduData["Alabama"])

tag = "S1201"
currFile = BASE_DIR + "ACS_" + year + FT + tag + end
entries = ReadEntries(tag)
m_list = [29,31,33,35,37,41,43,45,47,49,53,55,59,61,65,67,69,71,73,77,79,81,83,85,89,91,93,95,97]
f_list = [113,115,117,119,121,125,127,129,131,133,137,139,141,143,145,149,151,153,155,157,161,163,165,167,169,173,175,177,179,181]
marData = ReadData(currFile, entries, m_list, f_list)

tag = "B02001"
currFile = BASE_DIR + "ACS_" + year + FT + tag + end
entries = ReadEntries(tag)
tags = [3,5,7,9,11,13,15,17]
racData = ReadData_Race(currFile, entries, tags)
print(currFile)
print(racData["Alabama"])
