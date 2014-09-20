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

var symbolsPath = 'data/symbols';
var symbolDataPath = 'data/symbolData';

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
 * @resolve: array of string symbols
 */
function getSymbols() {
   return readFile(symbolsPath)
   .then(function(data) {
      var lines = data.split('\n');

      return lines.reduce(function(symbols, line) {
         if (line !== '' && !/^\s/.test(line)) {
            var lineSymbols = line.split(', ');
            symbols = symbols.concat(lineSymbols);
         }

         return symbols;
      }, []);
   });
}

/**
 * @resolve: when the stock data has been appended to the stocks file.
 */
function writeDataToFile(data) {
   var timestamp = Date.now();
   var path = symbolDataPath + '/' + timestamp + '.json';
   // TODO if exists + pid? should uniqueify it
   return writeFile(path, JSON.stringify(data));
}

Promise.resolve()
.then(function() {
   Stats.record('StockTracker.market.start');
})
.then(getSymbols)
.then(function(symbols) {
   return MarketRetriever.retrieve({symbols: symbols})
})
.then(writeDataToFile);
.done(function() {
   Stats.record('StockTracker.market.stop');
},
function(err) {
   // TODO
   Stats.record('StockTracker.market.fatalError', err.toString());
   throw err;
});
