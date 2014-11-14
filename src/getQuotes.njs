/**
 * Get quotes for a collection of ticker symbols and/or indexes.
 */
module.exports = getQuotes;

require('utils');
var fields = require('./data/ticker-symbol-fields.njs'),
    http = require('http'),
    debug = require('debug')('StockTracker:getQuotes');

getQuotes.getQuotes = getQuotes;
getQuotes.splitSymbols_ = splitSymbols_;
getQuotes.getQuotes_ = getQuotes_;
getQuotes.fromArgs_ = fromArgs_;

getQuotes.defaultMaxQuotesPerRequest = 200; // found out through testing
getQuotes.maxQuotesPerRequest = getQuotes.defaultMaxQuotesPerRequest;

/**
 * Get the quotes for `symbols` -- an array of ticker symbols..
 *
 * @resolve an array of csvs for symbols
 */
function getQuotes(symbols) {

  var symbolsArrays = getQuotes.splitSymbols_(symbols);
  var csvPromises = symbolsArrays.map(getQuotes.getQuotes_);

  return Promise.all(csvPromises).then(function all(csvsPerPromise) {
    var csvs = [];

    for (var csvsI in csvsPerPromise) {
      csvs = csvs.concat(csvsPerPromise[csvsI]);
    }

    return csvs;
  });
}

/**
 * Split the symbols array into partions no greater than maxQuotesPerRequest.
 */
function splitSymbols_(symbols) {
  var symbolsArrays = [];

  while (symbols.length) {
    var syms = symbols.splice(0, getQuotes.maxQuotesPerRequest);
    symbolsArrays.push(syms);
  }

  return symbolsArrays;
}

/**
 * The real getQuotes which only works with sizes less than or equal to
 *    the current maxQuotesPerRequest (set by yahoo).
 */
function getQuotes_(symbols) {
  return new Promise(function(resolve, reject) {
    var path = 'http://download.finance.yahoo.com/d/quotes.csv?s=' +
        symbols.join('+') + '&f=' + fields.join('');

    debug(path);

    var req = http.request(path, onResponse);
    req.on('error', onError);
    req.end();
    
    function onResponse(res) {
      debug('response received!');

      var str = '';

      res.on('data', function onData(data) {
        str += data;
      });

      res.on('end', function onEnd() {
        debug('end receive!');
        var lines = str.split('\n');
        lines.pop(); // extra terminator at end
        resolve(lines);
      });

      res.on('error', onError);
    }

    function onError(err) {
      reject(err);
    }
  });
};

/**
 * Get symbols from an array of command line arguments.
 *
 * @resolve an array of csvs.
 */
function fromArgs_(args) {
  var symbols = [];

  for (var i = 0; i < args.length; ++i) {
    symbols = symbols.concat(args[i].split(' '));
  }

  debug(symbols);

  return getQuotes(symbols);
}

if (!module.parent) {
  var args = Array.prototype.slice.call(process.argv, 2);
  getQuotes.fromArgs_(args)
  .done(console.log.bind(console));
}
