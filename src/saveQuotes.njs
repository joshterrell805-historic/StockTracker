/**
 * Read a list of symbols to get quotes for from data/symbols
 * Get a quote for every symbol in the list, and save a new record in
 *    data/quotes.
 */

require('utils');
var Stats = require('./lib/Stats.njs'),
    getQuotes = require('./getQuotes.njs');

var symbolsPath = 'data/symbols';
var saveQuotesPath = 'data/quotes';

/**
 * @resolve: array of string symbols
 */
function getSymbols() {
  return Utils.readFile(symbolsPath)
  .then(function(data) {
    var lines = data.split('\n');

    return lines.reduce(function(symbols, line) {
      if (line !== '' && !/^#/.test(line)) {
        var lineSymbols = line.split(', ');
        symbols = symbols.concat(lineSymbols);
      }

      return symbols;
    }, []);
  });
}

/**
 * @resolve: when the stock data has been written to file.
 */
function writeDataToFile(data) {
  var timestamp = Date.now();
  var path = saveQuotesPath + '/' + timestamp;
  return Utils.writeFile(path, JSON.stringify(data));
}

Promise.resolve()
.then(function() {
  Stats.record('StockTracker.getQuotes.start');
})
.then(getSymbols)
.then(getQuotes)
.then(writeDataToFile)
.done(function() {
  Stats.record('StockTracker.getQuotes.stop');
},
function(err) {
  Stats.record('StockTracker.getQuotes.fatalError', err.toString());
  throw err;
});
