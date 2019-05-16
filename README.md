# CS587_Database_Project

## Project Documentation
This project involves three project reports which can be found at the following links:

[Project - Part 1](./documentation/PROJECT_PART1.md)
[Project - Part 2](./documentation/PROJECT_PART2.md)


The basis of this project is the Wisconsin Benchmark and assessing database efficiency using its standards. As a result, some code is intended to duplicate steps required in the Benchmark's documentation. Any code used or related to the benchmark's documentation should be cited in comments above the code. The source document is found on our class D2L site, and the MLA citation is below:

DeWitt, David J. "The Wisconsin Benchmark: Past, Present, and Future." *Computer Science Department, University of Wisconsin*, p. 1-43.

## Project Structure
A brief explanation of the project file structure

### `data`
Directory containing the SQL file for data generation plus text files representing data loaded into the DBMS

### `documentation`
Directory containing markdown files for the various parts of the project plus any images included in that documentation

### `test`
Directory containing unit tests for code. Unit tests are not intended to be complete but for personal verification of work. Tests can be run with the command `npm test` from the root directory.

### Javascript files
Currently loosely stored in the root directory of this project since not much code is required

## Data Generation
First, if you are trying to use this project locally, make sure you have `npm` installed on your system and havev run `npm install` in the root directory of this project to download necessary dependancies. To generate data to be inserted into the DBMS from that point, run the following command from the root directory:
```node ./main.js [# of tuples in relation] [optional filename to output data to]```
The number of tuples must be between 1 and 100000000 per the sample script in the Wisconsin Benchmark paper (DeWitt 10). The filename is optional and will default to `test.txt` in the root directory if no input is provided

