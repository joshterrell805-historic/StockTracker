var assert = require('assert');
var getQuotes = require('./src/getQuotes.njs');

describe('getQuotes', function() {

  describe('#getQuotes', function() {

    beforeEach(function() {
      getQuotes.maxQuotesPerRequest = getQuotes.defaultMaxQuotesPerRequest;
    });

    it('should get data for a few symbols in one request', function(done) {
      getQuotes(['MSFT', 'GOOG', 'AAPL']).done(function (quotes) {
        assert.equal(quotes.length, 3);
        done();
      });
    });

    it('should get data for a large amount of symbols in multiple requests', function(done) {
      getQuotes.maxQuotesPerRequest = 2;
      getQuotes(['MSFT', 'GOOG', 'AAPL']).done(function (quotes) {
        assert.equal(quotes.length, 3);
        done();
      });
    });

  });

  describe('#splitSymbols_', function() {

    it('should split large sets of symbols into multiple arrays', function() {
      var input = [{}, {}, {}, {}, {}];
      var cases = [{
          max: 5,
          expected: input
        },{
          max: 4,
          expected: [[input[0], input[1], input[2], input[3]], [input[4]]]
        },{
          max: 3,
          expected: [[input[0], input[1], input[2]], [input[3], input[4]]]
        },{
          max: 2,
          expected: [[input[0], input[1]], [input[2], input[3]], [input[4]]]
        },{
          max: 1,
          expected: [[input[0]], [input[1]], [input[2]], [input[3]],
              [input[4]]]
      }];

      for (var i = 0; i < cases; ++i) {
        var c = cases[i];
        getQuotes.maxQuotesPerRequest = c.max;
        var output = getQuotes.splitSymbols_(input)

        assert.strictEqual(output.length, c.expected.length, i);

        for (var j = 0; j < output.length; ++j) {
          assert.deepEqual(output[j], c.expected[j], j);
        }
      }
    });

  });

  describe('#fromArgs_', function() {
    it('should return the csvs', function(done) {
      getQuotes.fromArgs_(['MSFT APPL', 'AA']).done(function (quotes) {
        assert.equal(quotes.length, 3);
        done();
      });
    });
  });

});
