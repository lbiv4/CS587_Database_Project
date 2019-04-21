const fs = require('fs');

/**
 * Method to produce a unique random integer. Assumes that the input array is unique; from there, picks a random 
 * value in the array and removes value for subsequent use
 * @param {Array<int>} array An array of unique values
 */
const uniqueRandom = (array) => {
    const rand = Math.floor(Math.random()*array.length);
    const output = array[rand];
    array.splice(rand, 1); 
    return output;
}

/**
 * Method to turn an integer value into a unique string representation according the the Wisconsin Benchmark.
 * See the README for the documentation citation and the `convert` method on page 9 of that document for 
 * source code for this method, noting that some modications have been made to convert to Javascript and 
 * accurately output a unique string
 * @param {int} unique 
 */
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

module.exports = {uniqueRandom, uniqueRandomToString};


