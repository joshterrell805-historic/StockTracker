/**
 * !Executable
 *
 * Determine whether the stock market is open.
 * If it's open read the list of symbols and indexes and make requests for each.
 * Append the responses to one "a big ass file" that will be truncated every day
 *  upon syncing with the backup server.
 */

var Promise = require('promise'),
    Stats = require('../lib/Stats.njs'),
    MarketRetriver = require('../lib/MarketRetriever.njs'),
    fs = require('fs'),
    _ = require('underscore');

var userFeedsPath = '../data/feeds';
var trackedFeedsPath = '../data/trackedFeeds.json';
var updatedFeedsDirPath = '../data/updatedFeeds';

readFile = function() {
   var read = Promise.denodeify(fs.readFile);
   return function(path) {
      return read(path, {encoding: 'utf-8'});
   };
}();

writeFile = function() {
   var write = Promise.denodeify(fs.writeFile);
   return function(path, data) {
      // TODO
      return write(path, {encoding: 'utf-8'}, data);
   };
}();

/**
 * @resolve: true/false for if the stock market is open.
 */
function isOpen() {
}

/**
 * @resolve: array of string symbols
 */
function getSymbols() {
}

/**
 * @resolve: when the stock data has been appended to the stocks file.
 */
function writeDataToFile(data) {
}

Promise.resolve()
.then(function() {
   Stats.record('StockTracker.market.start');
})
.then(isOpen)
.then(function(isOpen) {
   if (!isOpen) {
      return Promise.resolve();
   }

   var symbolsP = getSymbols();

   return getSymbols()
   .then(function(symbols) {

      return MarketRetriever.retrieve({symbols: symbols})
      .then(writeDataToFile);
   });
})
.done(function() {
   Stats.record('StockTracker.market.stop');
},
function(err) {
   // TODO
   Stats.record('StockTracker.market.fatalError', err.toString());
   throw err;
});
