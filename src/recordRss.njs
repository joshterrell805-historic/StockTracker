require('utils');
var getRss = require('./getRss.njs'),
    Stats = require('./lib/Stats.njs'),
    debug = require('debug')('StockTracker:rss:fetch');

var userFeedsPath = 'data/feeds';
var trackedFeedsPath = 'data/trackedFeeds.json';
var updatedFeedsDirPath = 'data/rss';

/**
 * Get the user-defined feeds are stored in data/feeds
 *
 * Get the tracked feeds from  data/trackedFeeds.json
 *
 * Compare the two deleting any tracked feeds that aren't in the user-defined
 *  feeds and adding any user-defiend feeds that aren't in the tracked feeds.
 *
 * @resolve: an array of hash
 *    {url, etag, lastModified}
 */
function getFeeds() {
  debug('getFeeds');
  var userP = getUserFeeds();
  var trackedP = getTrackedFeeds();
  return Promise.all([userP, trackedP]).then(function(all) {
    var userUrls = all[0];
    var trackedFeeds = all[1];
    
    return userUrls.reduce(function(feeds, url) {
      var feed = _.find(trackedFeeds, {url: url});

      if (!feed) {
        feed = {
          url: url,
          etag: null,
          lastModified: null,
        };
      }

      feeds.push(feed);
      return feeds;
    }, []);
  });
}

/**
 * Make a request for each feed. When all requests have finished,
 *
 * @resolve: an array of hash of updatedFeeds {url, rss}
 */
function getUpdatedFeeds(feeds) {
  var rssPs = feeds.map(getRss);

  // array of hash {url, rss}
  var updatedFeeds = [];
  var completedRequestCount = 0;
  var MAX_WAIT = 1000 * 60 * 2; // 2 min

  return new Promise(function(resolve, reject) {
    var timeoutId = setTimeout(function() {
      reject(new Error('Timeout waiting for all requests to finish'));
    }, MAX_WAIT);

    rssPs.forEach(function(rssP, i) {
      var url = feeds[i].url;
      Stats.record('StockTracker.rss.fetch.request', {
        url: url,
      });

      rssP.then(function rssResponse(rss) {
        var modified = rss !== null;
        Stats.record('StockTracker.rss.fetch.response', {
          url: url,
          modified: modified,
        });

        if (modified) {
          updatedFeeds.push({
            url: url,
            rss: rss,
          });
        }

        checkDone();
      },
      function rssError(err) {
        Stats.record('StockTracker.rss.fetch.error', {
          url: url,
          code: err.code,
          message: err.message,
        });

        checkDone();
      }).done();
    });

    function checkDone() {
      if (++completedRequestCount == feeds.length) {
        // TODO
        clearTimeout(timeoutId);
        resolve(updatedFeeds);
      }
    }
  });
}

/**
 * @resolve: array of urls
 */
function getUserFeeds() {
  debug('getUserFeeds');
  return Utils.readFile(userFeedsPath)
  .then(function(data) {
    var lines = data.split('\n');
    return lines.reduce(function(urls, line) {
      if (line !== '' && !/^#/.test(line)) {
        urls.push(line);
      }

      return urls;
    }, []);
  });
}

/**
 * @resolve: array of feed hash (url, etag, lastModified)
 */
function getTrackedFeeds() {
  debug('getTrackedFeeds');
  return Utils.readFile(trackedFeedsPath)
  .then(null, function(err) {
    if (err.code === 'ENOENT') {
      return '{}';
    }

    throw err;
  })
  .then(JSON.parse);
}

/**
 * @param feeds array: array of hash of {url, etag, lastModified}
 */
function saveTrackedFeeds(feeds) {
  return Utils.writeFile(trackedFeedsPath, JSON.stringify(feeds));
}

/**
 * @param updatedFeedChannels array: array of hash of {url, channels}
 */
function saveUpdatedFeeds(updatedFeedChannels) {
  var timestamp = Date.now();
  var path = updatedFeedsDirPath + '/' + timestamp + '.json';
  return Utils.writeFile(path, JSON.stringify(updatedFeedChannels));
}


Promise.resolve()
.then(function() {
  Stats.record('StockTracker.rss.start');
})
.then(getFeeds)
.then(function(trackedFeeds) {
  return getUpdatedFeeds(trackedFeeds)
  .then(function(updatedFeeds) {

    // update the etag and lastModified date
    var saveFeeds = trackedFeeds.map(function(trackedFeed) {
      var updatedFeed = _.findWhere(updatedFeeds, {url: trackedFeed.url});
      if (updatedFeed) {
        updatedFeed = {
          url: updatedFeed.url,
          etag: updatedFeed.rss.etag,
          lastModified: updatedFeed.rss.lastModified,
        };
        debug('updated %o', updatedFeed);
      }
      return _.defaults({}, updatedFeed, trackedFeed);
    });
    var saveTrackedP = saveTrackedFeeds(saveFeeds);

    // actually save the updated channels to disk.
    var updatedFeedChannels = updatedFeeds.map(function(updatedFeed) {
      return {
        url: updatedFeed.url,
        channels: updatedFeed.rss.channels,
      };
    });
    var saveChannelsP = saveUpdatedFeeds(updatedFeedChannels);

    return Promise.all([saveTrackedP, saveChannelsP]);
  });
})
.done(function() {
  Stats.record('StockTracker.rss.finish');
},
function(err) {
  Stats.record('StockTracker.rss.fatalError', err.toString());
  throw err;
});
