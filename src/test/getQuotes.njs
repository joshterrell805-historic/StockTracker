module.exports = getQuotes;

var Promise = require('promise'),
    fields = require('./fields.njs'),
    http = require('http'),
    debug = require('debug')('StockTracker:getQuotes');

var maxQuotesPerRequest = 200; // found out through testing

/**
 * Get the quotes for `symbols`.
 *
 * @resolve an array of csvs for symbols
 */
function getQuotes(symbols) {
   var symbolsArrays = [];

   while (symbols.length) {
      var syms = symbols.splice(0, maxQuotesPerRequest);
      symbolsArrays.push(syms);
   }

   var csvPromises = symbolsArrays.map(_getQuotes);

   return Promise.all(csvPromises).then(function all(csvsPerPromise) {
      var csvs = [];

      for (var csvsI in csvsPerPromise) {
         csvs = csvs.concat(csvsPerPromise[csvsI]);
      }

      return csvs;
   });
}

/**
 * The real getQuotes which only works with sizes less than or equal to
 *  the current maxQuotesPerRequest (set by yahoo).
 */
function _getQuotes(symbols) {
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
