var fields = require('./data/ticker-symbol-fields.njs'),
    pSymbols = require('./pSymbols.njs'),
    _ = require('lodash'),
    assert = require('assert');

module.exports = parseQuotes;

/**
 * Raw JSON object as recorded in data/quotes/<timestamp>.json from
 * recordQuotes.njs.
 */
function parseQuotes(quotes) {
  return _.chain(quotes)
  .map(function(quoteString, index) {
    if (quoteString.indexOf('No such ticker symbol.') !== -1) {
      return null;
    }

    var curIdx = 0;
    var values = [];

    while (curIdx < quoteString.length + 1) {
      var q_idx = quoteString.indexOf('"', curIdx);
      var c_idx = quoteString.indexOf(',', curIdx);
      var value = null;

      if (c_idx === -1) {
        var c_idx = quoteString.length;
      }
      
      if (c_idx < q_idx || q_idx === -1) {
        value = quoteString.substring(curIdx, c_idx);
        curIdx = c_idx + 1;
      } else {
        assert.strictEqual(q_idx, curIdx);
        q_idx = quoteString.indexOf('"', curIdx + 1);
        assert.notStrictEqual(q_idx, -1);
        value = quoteString.substring(curIdx + 1, q_idx);
        curIdx = q_idx + 2;
      }

      if (['N/A', '-'].indexOf(value) !== -1) {
        value = null;
      }
      values.push(value);
    }

    assert.strictEqual(curIdx, quoteString.length + 1);

    // some magic parsing...
    // because yahoo puts commas in csv fields for formatting numbers
    var used = 0;
    var quote = _.reduce(fields, function(memo, field) {
      memo[field] = values[used++];
      if (['f6', 'a5', 'b6', 'k3'].indexOf(field) !== -1) {
        if (memo[field] !== null) {
          assert.strictEqual(memo[field].indexOf('.'), -1);
          assert.notStrictEqual(memo[field], 'N/A');
          memo[field] = memo[field].trim();
          assert(memo[field].length >= 1 && memo[field].length <= 3);

          while(values[used] !== null && values[used].indexOf('.') === -1) {
            memo[field] += values[used++];
          }
        }
      }
      if (memo[field] !== null) {
        memo[field] = memo[field].trim();
      }
      return memo;
    }, {});

    assert.strictEqual(used, values.length);

    return quote;
  })
  .value();
}

if (!module.parent) {
  var filename = require(process.argv[2] || './data/quotes/1429038902067.json');
  var quotes = parseQuotes(filename)
  console.log(quotes);
}
