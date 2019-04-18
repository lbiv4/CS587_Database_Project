const mocha = require('mocha');
const chai = require('chai');
const rg = require('../random_generator.js')
const expect = chai.expect;


describe('Random Generation Unit Tests', function() {
    let testArray;
    let initialArray;
    beforeEach(function() {
        testArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        initialArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    });

    describe('uniqueRandom unit tests', function() {
        it('should produce a random, unique number from an array', function(done) {
            let dataArray = [];

            for(let i = 0; i < testArray.length; i++) {
                const num = rg.uniqueRandom(testArray);
                expect(initialArray).to.include(num);
                expect(dataArray).to.not.include(num);
                dataArray.push(num);
            }

            done();
        });
    });

    describe('uniqueRandomToString unit tests', function() {
        it('should produce a random, unique number from an array', function(done) {
            let dataArray = [];

            for(let i = 0; i < testArray.length; i++) {
                const num = rg.uniqueRandom(testArray);
                expect(initialArray).to.include(num);
                expect(dataArray).to.not.include(num);
                dataArray.push(num);
            }

            done();
        });
    });
    
});