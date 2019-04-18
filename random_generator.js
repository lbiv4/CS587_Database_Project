const fs = require('fs');


const uniqueRandom = (array) => {
    const rand = Math.floor(Math.random()*array.length);
    const output = array[rand];
    array.splice(rand, 1); 
    return output;
}

const uniqueRandomToString = (unique) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let num = unique; //Don't alter unique
    let result = "AAAAAAA";
    let index = 0;
    while(index < result.length && num > 0) {
        result = result.slice(0, index) + chars.charAt(num%26) + result.slice(index+1);
        index++;
        num = Math.floor(num/26);
    }
    return result;
}

console.time('test');
const tuples = process.argv[2];
const allValues = [];
const x45string = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
for(let i = 0; i < tuples; i++) {
    allValues.push(i);
}


fs.writeFile('test.txt', "unique1", () => {});

for(let j = 0; j < tuples; j++) {
    const rowValues = [];
    const unique1 = uniqueRandom(allValues);
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
    rowValues.push(uniqueRandomToString(unique1)+x45string); //stringu1
    rowValues.push(uniqueRandomToString(j)+x45string); //stringu2
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


    let rowString = rowValues.toString();
    rowString = "\n" + rowString.substring(1, rowString.length-1);


    fs.appendFile('test.txt', rowString, () => {});
}

console.timeEnd('test');

module.exports = {uniqueRandom, uniqueRandomToString};


