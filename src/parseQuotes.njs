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
    var curIdx = 0;
    var quote = {};

    for (var j = 0; j < fields.length; ++j) {
      var field = fields[j];
      var q_idx = quoteString.indexOf('"', curIdx);
      var c_idx = quoteString.indexOf(',', curIdx);

      if (c_idx === -1) {
        if (j === fields.length - 1) {
          var c_idx = quoteString.length;
        } else {
          console.log(j, fields.length);
          throw new Error('end of quote string reached before all fields parsed');
        }
      }
      
      if (c_idx < q_idx || q_idx === -1) {
        var sub = quoteString.substring(curIdx, c_idx);
        if (field == 'f6' && sub.substr(0, 3) === '   ') {
          c_idx = quoteString.indexOf(',', c_idx + 1);
          assert.notStrictEqual(c_idx, -1);
          c_idx = quoteString.indexOf(',', c_idx + 1);
          assert.notStrictEqual(c_idx, -1);
          var sub = quoteString.substring(curIdx, c_idx);
        }
        quote[field] = sub;
        curIdx = c_idx + 1;
      } else {
        assert.strictEqual(q_idx, curIdx);
        q_idx = quoteString.indexOf('"', curIdx + 1);
        assert.notStrictEqual(q_idx, -1);
        var sub = quoteString.substring(curIdx + 1, q_idx);
        quote[field] = sub;
        curIdx = q_idx + 2;
      }

      if (quote[field] === 'N/A') {
        quote[field] = null;
      }
    }

    assert.strictEqual(curIdx, quoteString.length + 1);
    return quote;
  })
  .value();
}

if (!module.parent) {
  var qs = parseQuotes(require('./data/quotes/1429038902067.json'));
  console.log(qs);
}
