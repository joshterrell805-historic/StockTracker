/**
 * resolve to an array of string symbols from data/symbols
 */
module.exports = pSymbols;

var Promise = require('bluebird'),
    fs = require('fs');


function pSymbols() {
  return symbolsP;
}

var symbolsP = Promise.promisify(fs.readFile)('./data/symbols')
.then(function(data) {
  var lines = data.toString().split('\n');

  return lines.reduce(function(symbols, line) {
    if (line !== '' && !/^#/.test(line)) {
      var lineSymbols = line.split(', ');
      symbols = symbols.concat(lineSymbols);
    }

    return symbols;
  }, []);
});

if (!module.parent) {
  pSymbols().then(console.log.bind(console));
}
