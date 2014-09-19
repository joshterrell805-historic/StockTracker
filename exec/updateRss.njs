/**
 * Get the channels of all rss feeds that have changed since the last time
 *  running and save them to disk.
 */
var retrieveRss = require('../lib/RssRetriever.njs').retrieve,
    Stats = require('../lib/Stats.njs');

getFeeds();
.then(function(feeds) {
   var rssPs = feeds.map(retrieveRss);

   rssPs.forEach(function(rssP, i) {
      var url = feeds[i].url;
      Stats.record('StockTracker.rss.fetch.request', {
         url: url,
      });
      rssP.then(function(rss) {
         var modified = rss !== null;
         Stats.record('StockTracker.rss.fetch.response', {
            url: url,
            modified: modified,
         });

         if (modified) {
            return db.updateFeed(url, rss);
         }
      },
      function(err) {
         Stats.record('StockTracker.rss.fetch.error', {
            url: url,
            code: err.code,
         });
      }).done();
   });
}).done();

/**
 * The user-defined feeds are stored in data/feeds.conf
 */
function getFeeds() {
}
