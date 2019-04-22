/**
 * Main method for generating data per the Wisconsin Benchmark. See the citation in the README for the benchmark
 * documentation and pages 8-9 for the basis of this data generation
 */
const fs = require('fs');
const rg = require('./random_generator.js');

const tuples = process.argv[2];
const file = process.argv[3] !== undefined ? process.argv[3] : 'test.txt';
const columns = [
    "unique1",   
    "unique2",   
    "two",   
    "four",   
    "ten",   
    "twenty",   
    "onePercent",   
    "tenPercent",   
    "twentyPercent",   
    "fiftyPercent",   
    "unique3 integer",   
    "evenOnePercent",   
    "oddOnePercent",   
    "stringu1",   
    "stringu2",   
    "string4" 
]
let columnHeaders = columns.toString();
const allValues = [];
const x45string = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
if(tuples == undefined || tuples == NaN ||  tuples < 1 || tuples > 100000000) {
    console.log("Need to pass in a tuples between 1 and 100000000");
    process.exit(1);
}

for(let i = 0; i < tuples; i++) {
    allValues.push(i);
}


fs.writeFile(file, columnHeaders, () => {});

for(let j = 0; j < tuples; j++) {
    const rowValues = [];
    const unique1 = rg.uniqueRandom(allValues);
    const onePercent = unique1%100;
    let string4;

    //Add values in order to array
    rowValues.push(unique1);
    rowValues.push(j);
    rowValues.push(unique1%2);
    rowValues.push(unique1%4);
    rowValues.push(unique1%10);
    rowValues.push(unique1%20);
    rowValues.push(onePercent);
    rowValues.push(unique1%10);
    rowValues.push(unique1%5);
    rowValues.push(unique1%2);
    rowValues.push(unique1); //Unique3
    rowValues.push(onePercent * 2); 
    rowValues.push(onePercent * 2 + 1); 
    rowValues.push(rg.uniqueRandomToString(unique1)+x45string); //stringu1
    rowValues.push(rg.uniqueRandomToString(j)+x45string); //stringu2
    switch(j%4) {
        case 0: 
            string4 = "AAAAxxx" + x45string;
            break;
        case 1: 
            string4 = "HHHHxxx" + x45string;
            break;
        case 2: 
            string4 = "OOOOxxx" + x45string;
            break;
        case 3: 
            string4 = "VVVVxxx" + x45string;
            break;
    }
    rowValues.push(string4);


    let rowString = "\n" + rowValues.toString();

    fs.appendFile(file, rowString, () => {});
}