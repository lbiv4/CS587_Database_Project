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

module.exports = {uniqueRandom, uniqueRandomToString};


