var assert = require('assert');
var getRss = require('./src/getRss.njs');

describe('getRss', function() {
  
    describe('#retrieve', function() {
      
      it('should pass the smoke test (TODO split this up)', function(done) {
        var options = {
          url: 'http://rss.cnn.com/rss/cnn_topstories.rss',
          etag: null,
          lastModified: null
        };
        getRss(options).done(function(rss) {
          assert.notEqual(rss, null);
          assert(rss.etag.length > 0);
          assert(rss.lastModified.length > 0);
          assert(rss.channels.length > 0);
          assert(rss.channels[0].item.length > 0);
          assert(rss.channels[0].item[0].title.length > 0);
          assert(rss.channels[0].item[0].link.length > 0);
          assert(rss.channels[0].item[0].pubDate.length > 0);
          done();
        });
      });

    });
});
