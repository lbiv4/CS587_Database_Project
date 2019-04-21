# Project - Part 1

## Overview
The goal of this part of the project was to setup the GitHub repository, create scripts to generate data according the specification in the Wisconsin Benchmark paper, and then load some amount of data into the DBMS chosen. The repo design is explained in the [README](../README.md) file in the root of this project and the other two sections are explained below.

## Data Generation Scripts
To start, this project was done in Javascript due to my personal comfort with the language, my usage of it in the previous database project in CS 586, and past experience starting a Node JS project. To generate data, I created two files. First, `random_generation.js` serves as a utilities files that contains methods to return a random value from an array and also convert an integer into a specific string format as defined in the Wisconsin Benchmark. The former method is designed that way because I opted to do a simple process of creating an array of all values from 0 - (MAXTUPLES-1) and then continuosly picking a random value from it (removing the selected value) in order to generate the "unique" value for each code. While it's probably not as efficient as the example code in the Benchmark paper, I preferred it because it was a process I understood more easily and didn't take exceedingly long based on personal experimentation (roughly 15 seconds to generate 10 million rows of data) For the second method to create a unique string, it's worth noting that this code does parrot the design of the C++ code of the `convert` example function in the paper (DeWitt 9), but I tweaked it into something that is more streamlined and accounts for the issues that were noted in class discussions.

The other script file I created is `main.js` which holds the majority of the data generation process. It simply creates an array of values from 0 - (MAXTUPLES-1), repeatedly picks and removes a unique value from it, then generates a series of values according to the Benchmark standard (DeWitt 8-9). Each row is then written to a text file as a common seperated string to essentially generate a CSV file. From there, the CSV can be loaded into the DBMS quite easily. 

## Data Loading
The next part of the project was to load the generated data

## Reflections

## Works Cited
DeWitt, David J. "The Wisconsin Benchmark: Past, Present, and Future." *Computer Science Department, University of Wisconsin*, p. 1-43.
