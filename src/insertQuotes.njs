var parseQuotes = require('./parseQuotes.njs'),
    fs = require('fs'),
    Promise = require('bluebird'),
    PMysql = require('pmysql'),
    _ = require('lodash'),
    assert = require('assert'),
    quotesDir = process.env.QUOTES_DIR || '/home/josh/stock-data/quotes/';

var pReaddir = Promise.promisify(fs.readdir),
    pReadFile = Promise.promisify(fs.readFile);

var pMysql = new PMysql(require('./mysql-config.js'));
pMysql.start();

var nextTs = null;
pMysql.pQuery('select unix_timestamp(max(ts)) as ts from quotes')
.then(function(res) {
  assert.strictEqual(res.length, 1);
  nextTs = parseInt(res[0].ts || 0);
  console.log('continuing from: ' + nextTs);
  return pMysql.pQuery('delete from quotes where ts = from_unixtime(?)',
      [nextTs]);
})
.then(function() {
  return pReaddir(quotesDir);
})
.then(function(filenames) {
  return Promise.each(filenames, function(filename) {
    var ts = parseInt(filename.substr(0, filename.length - '.json'.length));
    ts = Math.floor(ts/1000);
    if (ts >= nextTs &&
        filename.indexOf('.json') === filename.length - '.json'.length) {
      console.log(ts);
      return pReadFile(quotesDir + filename)
      .then(JSON.parse)
      .then(parseQuotes)
      .then(function(quotes) {
        return pInsert(ts, quotes);
      });
    }
  });
})
.done();

function pInsert(ts, quotes) {
  var p = _.chain(quotes)
  .map(function(quote) {
      if (quote === null) {
        // No such ticker symbol.
        return null;
      } else {
        var params = _.values(_.pick(quote, 's', 'v', 'l1'));
        params.splice(1, 0, ts);
        return params;
      }
  })
  .filter()
  .value();

  var q = 'insert into quotes (symbol, ts, volume, last_trade) values ';
  q += _.times(p.length, _.constant(
      '((select id from symbols s where s.symbol = ?), ' +
      'from_unixtime(?), ?, ?)')).join(',');
  p = _.flatten(p);

  return pMysql.pQuery(q, p);
}
