from __future__ import print_function, division
import csv
import os
from decimal import *
import json

def Read_AgeSex(filename, m_list, m_add, f_list, f_add, labels):
    data = {}
    genders = ["M", "F"]
    with open(filename) as csvFile:
        next(csvFile, None) # Skips first line
        next(csvFile, None) # Skips second line
        lineRead = csv.reader(csvFile, delimiter=',')
        for item in lineRead:
            geo_data = {}
            geo = item[2]
            if geo == "Puerto Rico":
                break
            age_data = {}
            for i in range(0, len(labels)):
                label = labels[i].split('-')
                if len(label) > 1:
                    diff = int(label[1]) - int(label[0])
                else:
                    diff = 0

                if diff > 0:
                    ages = range(int(label[0]),int(label[1])+1)
                else:
                    ages = [label[0]]

                for age in ages:
                    gen_data = {}
                    for gender in genders:
                        pop_data = {}
                        if gender == "M":
                            if m_list[i] == m_add[0]:
                                pop = 0
                                for ind in m_add:
                                    pop = pop + int(item[ind])
                            else:
                                pop = int(item[m_list[i]])
                                if len(ages) > 1:
                                    pop = int(pop/len(ages))
                        else:
                            if f_list[i] == f_add[0]:
                                pop = 0
                                for ind in m_add:
                                    pop = pop + int(item[ind])
                            else:
                                pop = int(item[f_list[i]])
                                if len(ages) > 1:
                                    pop = int(pop/len(ages))
                        pop_data["Population"] = str(pop)
                        gen_data[gender] = pop_data
                    age_str = str(age)
                    age_data[age_str] = gen_data
            data[geo] = age_data
    return data

def Read_Education(data, filename, m_list, m_add, f_list, f_add, labels):
    genders = ["M", "F"]
    with open(filename) as csvFile:
        next(csvFile, None) # Skips first line
        next(csvFile, None) # Skips second line
        lineRead = csv.reader(csvFile, delimiter=',')
        for item in lineRead:
            geo = item[2]
            if geo == "Puerto Rico":
                break
            for item_ in labels:
                ages = item_[0].split('-')
                label_lst = item_[1]

                if ages[0] == "18":
                    ages = range(18, 25)
                    for i in range(0,len(ages)):
                        ages[i] = str(ages[i])
                else:
                    ages = range(25, 66)
                    for i in range(0,len(ages)):
                        if ages[i] == 65:
                            ages[i] = str(ages[i]) + "+"
                        else:
                            ages[i] = str(ages[i])
                for age in ages:
                    if age != "65+" and int(age) < 25:
                        delta = 24 - 18 + 1
                        base_idx = 0
                    else:
                        delta = 65 - 25 + 1
                        base_idx = 4
                    for gender in genders:
                        for i in range(0, len(label_lst)):
                            edu = label_lst[i]
                            index = base_idx + i
                            if gender == "M":
                                edu_per = 0.0
                                if m_list[index] == m_add[0][0]:
                                    for idx in m_add[0]:
                                        edu_per = edu_per + float(item[idx])
                                elif m_list[index] == m_add[1][0]:
                                    for idx in m_add[1]:
                                        edu_per = edu_per + float(item[idx])
                                else:
                                    edu_per = float(item[m_list[index]])
                            else:
                                edu_per = 0.0
                                if f_list[index] == f_add[0][0]:
                                    for idx in f_add[0]:
                                        edu_per = edu_per + float(item[idx])
                                elif f_list[index] == f_add[1][0]:
                                    for idx in f_add[1]:
                                        edu_per = edu_per + float(item[idx])
                                else:
                                    edu_per = float(item[f_list[index]])
                            edu_per = edu_per/100.0
                            edu_per_str = '%.4f' % (edu_per)
                            data[geo][age][gender][edu] = edu_per_str
    return

def Read_MaritalStatus(data, filename, m_list, m_add, f_list, f_add, labels):
    genders = ["M", "F"]
    with open(filename) as csvFile:
        next(csvFile, None) # Skips first line
        next(csvFile, None) # Skips second line
        lineRead = csv.reader(csvFile, delimiter=',')
        for item in lineRead:
            index_offset = 0
            geo = item[2]
            if geo == "Puerto Rico":
                break
            for item_ in labels:
                ages = item_[0].split('-')
                label_lst = item_[1]
                if len(ages) > 1:
                    ages = range(int(ages[0]), int(ages[1]) + 1)
                    for i in range(0, len(ages)):
                        ages[i] = str(ages[i])
                for i in range(0, len(label_lst)):
                    m_status = label_lst[i]
                    for age in ages:
                        if age != "65+" and int(age) < 18:
                            continue
                        for gender in genders:
                            if gender == "M":
                                m_per = item[m_list[index_offset]]
                                if m_per == "N":
                                    m_per = "0.0"
                                m_per = float(m_per)/100.0
                                m_per = '%.4f' % m_per
                            else:
                                m_per = item[f_list[index_offset]]
                                if m_per == "N":
                                    m_per = "0.0"
                                m_per = float(m_per)/100.0
                                m_per = '%.4f' % m_per
                            data[geo][age][gender][m_status] = m_per
                    index_offset = index_offset + 1
    return

def Read_Races(data, filename, indices, labels):
    with open(filename) as csvFile:
        next(csvFile, None) # Skips first line
        next(csvFile, None) # Skips second line
        lineRead = csv.reader(csvFile, delimiter=',')
        for item in lineRead:
            index_offset = 0
            geo = item[2]
            if geo == "Puerto Rico":
                break
            total = float(item[indices[0]])
            total_str = '%.4f' % total
            data[geo]["Total_Population"] = total_str
            for i in range(1, len(indices)):
                per_pop = float(item[indices[i]])/total
                per_pop = '%.4f' % per_pop
                data[geo][labels[i]] = per_pop
    return


type_list = ["States","Counties"]
year_list = ["10", "11", "12", "13", "14", "15"]
SAVE_EXT = "_ACS.json"
end = "_with_ann.csv"
FT = ""

for type_ in type_list:
    SAVE_DIR = os.getcwd() + "/" + type_ + "/"
    for year in year_list:
        BASE_DIR = os.getcwd() + "/Raw_Data/" + type_ + "/20" + year + "_ACS/"

        if year == "05" or year == "06":
            FT = "_EST_"
        else:
            FT = "_1YR_"

        output_file = SAVE_DIR + "20" + year + SAVE_EXT
        # Age
        tag = "B01001"
        currFile = BASE_DIR + "ACS_" + year + FT + tag + end
        m_list = [15,17,19,21,23,25,27,29,31,33,35,37,39,41]
        m_add = [41,43,45,47,49,51]
        f_list = [63,65,67,69,71,73,75,77,79,81,83,85,87,89]
        f_add = [89,91,93,95,97,99]
        labels = ["18-19","20","21","22-24","25-29","30-34","35-39","40-44","45-49","50-54","55-59","60-61","62-64","65+"]

        data = Read_AgeSex(currFile, m_list, m_add, f_list, f_add, labels)

        # Education
        tag = "S1501"
        currFile = BASE_DIR + "ACS_" + year + FT + tag + end
        if year == "15":
            m_list = [21,33,45,57,81,105,117,141,153]
            m_add = [[81,93],[117,129]]
            f_list = [25,37,49,61,85,109,121,145,157]
            f_add = [[85,97],[121,133]]
        else:
            m_list = [11,17,23,29,41,53,59,71,77]
            m_add = [[41,47],[59,65]]
            f_list = [13,19,25,31,43,55,61,73,79]
            f_add = [[43,49],[61,67]]
        labels = [["18-24",["No HS","HS/GED","Some College", "Bachelors"]],["25+",["No HS","HS/GED","Some College","Bachelors","Graduate/Professional"]]]

        Read_Education(data, currFile, m_list, m_add, f_list, f_add, labels)

        # Martial Stauts
        tag = "S1201"
        currFile = BASE_DIR + "ACS_" + year + FT + tag + end
        m_list = [29,31,33,35,37,41,43,45,47,49,53,55,57,59,61,65,67,69,71,73,77,79,81,83,85,89,91,93,95,97]
        f_list = [113,115,117,119,121,125,127,129,131,133,137,139,141,143,145,149,151,153,155,157,161,143,165,167,169,173,175,177,179,181]
        labels = [["15-19",["Married","Widowed","Divorced","Separated","Never Married"]],["20-34",["Married","Widowed","Divorced","Separated","Never Married"]],["35-44",["Married","Widowed","Divorced","Separated","Never Married"]],["45-54",["Married","Widowed","Divorced","Separated","Never Married"]],["55-64",["Married","Widowed","Divorced","Separated","Never Married"]],["65+",["Married","Widowed","Divorced","Separated","Never Married"]]]

        Read_MaritalStatus(data, currFile, m_list, m_add, f_list, f_add, labels)

        # Race
        tag = "B02001"
        currFile = BASE_DIR + "ACS_" + year + FT + tag + end
        ind_list = [3,5,7,9,11,13,15,17]
        labels = ["Total","White","Black","American Indian or Alaskan Native","Asian","Native Hawaiian and Other Paciffic Islander","Other","Two or More"]
        Read_Races(data, currFile, ind_list, labels)

        print("Writing to: \"" + output_file + "\"")
        with open(output_file, 'w') as outfile:
            json.dump(data, outfile, sort_keys = True, indent = 4, ensure_ascii=False)
