var Assert = require('assert');
var getQuotes = require('./getQuotes.njs');

getQuotes(['MSFT', 'GOOG', 'AAPL']).done(function (quotes) {
   Assert.equal(quotes.length, 3);
   console.log('All tests passed!');
});
