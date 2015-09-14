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
  return Promise.all(
    _.map(quotes, function(quote) {
      if (quote === null) {
        // No such ticker symbol.
        return;
      }

      var tradeReal = quote.k1;
      if (tradeReal) {
        quote.k1 = tradeReal.match(/>(\d+.\d+)</)[1];
      }

      var params = _.values(_.pick(quote, 's', 'a', 'b2', 'a5', 'b', 'b3', 'b6',
          'v', 'l1', 'k1'));
      params.splice(1, 0, ts);
      if (_.filter(params, function(p) {return p!==null;}).length <
          params.length) {
        return;
      }

      return pMysql.pQuery('insert into quotes (symbol, ts, ask, ask_rt, ' +
          'ask_size, bid, bid_rt, bid_size, volume, last_trade, ' +
          'last_trade_rt) values (' +
          '(select id from symbols s where s.symbol = ?)' +
          ', from_unixtime(?), ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          params
      )
      .then(function(res) {
        assert.strictEqual(res.affectedRows, 1);
      })
    })
  );
}
