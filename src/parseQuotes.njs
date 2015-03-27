var fields = require('../data/ticker-symbol-fields.njs'),
    fs = require('fs'),
    assert = require('assert');

var filename = process.argv[2];
var quoteStrings = require(filename);
var quotes = [];
for (var i = 0; i < quoteStrings.length; ++i) {
  var quoteString = quoteStrings[i];
  var quote = {};
  var curIdx = 0;
  for (var j = 0; j < fields.length; ++j) {
    var f = fields[j];
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
      quote[f] = sub;
      curIdx = c_idx + 1;
    } else {
      assert.strictEqual(q_idx, curIdx);
      q_idx = quoteString.indexOf('"', curIdx + 1);
      assert.notStrictEqual(q_idx, -1);
      var sub = quoteString.substring(curIdx + 1, q_idx);
      quote[f] = sub;
      curIdx = q_idx + 2;
    }
  }
  assert.strictEqual(curIdx, quoteString.length + 1);
  quotes.push(quote);
}

console.log(quotes);
