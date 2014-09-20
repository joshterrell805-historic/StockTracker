/**
 * Determine whether the rss page has changed. If so, return all the channels
 *  containing all the items in for the feed. If the page hasn't changed,
 *  return null.
 *
 * The page has changed if the HEAD response from the feed returns a different
 *  etag or last-modified string than the etag and last-modified params provided.
 *
 * @param options hash: 
 *    url string: the full url to the rss feed
 *    etag string: the etag of the last successful request to this rss feed
 *    lastModified string: the last-modified date of the last successful...
 *
 * @reject error: if an error occured. Some or all of the following properties
 *  may be set depending on how far the request got along
 *    code string: the error code (see errorCodeToMessage)
 *    req array: requests made
 *    res array: responses recieved
 *    res[i].body the body of the response
 *
 * @resolve hash or null: null if the feed hasn't changed, otherwise a hash with
 *  the following properties.
 *    etag string: etag of the response
 *    lastModified string: last modified date of the response
 *    channels array: a channel is a hash with info about the channel including
 *     an item property
 *    channels[i].item array: an array of items
 *    channels[i].item[j] item: an item hash
 *       title: "the title of the item",
 *       link:  "link to item",
 *       author: "author of item",
 *       description: "description of item",
 *       pubDate: "date item was published",
 */
module.exports = {
   Retriever: Retriever,
   retrieve: retrieve,
   MAX_REDIRECTS: 5,
   MAX_RESPONSE_SIZE: 1024 * 512, // 512 KiB
   temp: function(filename) {
      var etag = 'shiz';
      var lastModified = 'today';

      return Promise.denodeify(require('fs').readFile)(filename, {encoding: 'utf-8'})
      .then(parseXml)
      .then(Retriever.prototype._extractChannels.bind(this))
      .then(function(channels) {
         return {
            etag: etag,
            lastModified: lastModified,
            channels: channels,
         }
      });
   },
};

var Promise = require('promise'),
    http = require('http'),
    url = require('url'),
    xml2js = require('xml2js'),
    Stats = require('./Stats.njs');

var parseXml = Promise.denodeify(xml2js.parseString);

function retrieve(options) {
   var retriever = new Retriever(options)
   return retriever.retrieve();
}

function Retriever(options) {
   this._options = options;
   this._errorInfo = {
      res: [],
      req: [],
   };
}

/**
 * @resolve: null for no changes, else channels (assuming no errors).
 */
Retriever.prototype.retrieve = function retrieve() {
//   var debug = require('debug')('RssItemRetriever:retriever');
//   debug('retriving %s', this._options.url);

   return this._hasFeedChanged()
   .then(function(hasFeedChanged) {
//      debug('%schanged %s', hasFeedChanged ? '' : 'not ', this._options.url);
      return hasFeedChanged ? this._getItems() : null;
   }.bind(this));
};

var errorCodeToMessage = {
   'INVALID_STATUS_CODE':     'the response had an unexpected status code',
   'MAX_REDIRECTS_EXCEEDED':  'the maximum redirects were exceeded while'
                               + ' requesting the page',
   'RESPONSE_BODY_EXCEEDED':  'the length of the body exceeded the maximum'
                               + ' length allowed for response bodies',
};

function RetrieverError(retriever, code) {
   var message = errorCodeToMessage[code];

   if (message === undefined) {
      throw new Error('Undefined RetrieverError "' + code + '"');
   }

   // TODO finish proper Error extension
   Error.call(this, message);

   this.req = retriever._errorInfo.req;
   this.res = retriever._errorInfo.res;
}

RetrieverError.prototype = Object.create(Error.prototype);

/**
 * @resolve: true/false for whether feed has changed.
 */
Retriever.prototype._hasFeedChanged = function _hasFeedChanged(path) {
//   var debug = require('debug')('RssItemRetriever:hasFeedChanged')

   return this._request('HEAD', this._options.url)
   .then(function(res) {
      // TODO are these the right header names?
      var etag = res.headers['etag'];
      var lastModified = res.headers['last-modified'];

      if (this._options.etag === etag
       && this._options.lastModified === lastModified) {
         return false;
      } else {
         return true;
      }
   }.bind(this));
};

/**
 * @resolve: array of channels 
 */
Retriever.prototype._getItems = function _getItems() {
   var etag, lastModified;
   return this._request('GET', this._options.url)
   .then(function(req) {
      // TODO
      etag = req.headers.etag;
      lastModified = req.headers['last-modified'];
   })
   .then(this._getBody.bind(this))
   .then(parseXml)
   .then(this._extractChannels.bind(this))
   .then(function(channels) {
      return {
         etag: etag,
         lastModified: lastModified,
         channels: channels,
      }
   });
};

/**
 * Make a request to the specified path and return a promise for the
 *  response only if the response has status code 200. Otherwise error out
 *  appropriately.
 */
Retriever.prototype._request = function _request(method, path, redirectCount) {
//   var debug = require('debug')('RssItemRetriever:_request')

   return new Promise(function(resolve, reject) {
      var parsed = url.parse(path);
      var options = {
         hostname: parsed.hostname,
         path: parsed.path,
         method: method,
      };

      var req = http.request(options, function(res) {
         this._errorInfo.res.push(res);
         var code = res.statusCode;
//         debug('received response %s', path);
//         debug('...status code "%s"', code);

         if (code == 200) {
            resolve(res);
         } else if([301, 302, 303, 305, 306].indexOf(code) != -1) {
            path = res.headers.Location;
//            debug('...redirect %s', path);

            if (redirectCount == module.exports.MAX_REDIRECTS) {
               var errorCode = 'MAX_REDIRECTS_EXCEEDED';
//               debug('...%s', errorCode);
               reject(new RetrieverError(this, errorCode));
            } else {
               // TODO Location?
               resolve(this._request(method, path, redirectCount + 1));
            }
         } else {
            // Note: 304 is an error. No req headers were set, so the content
            // should be modified.
            var errorCode = 'INVALID_STATUS_CODE';
//            debug('...%s', errorCode);
            reject(new RetrieverError(this, errorCode));
         }
      }.bind(this));

      this._errorInfo.req.push(req);

      req.on('error', function(e) {
//         debug('req error %s: %o', path, e);
         // TODO what kind of error?
         // TODO code
         // TODO close connection
         reject(e);
      });

//      debug('%s %s', method, path);
      req.end();

   }.bind(this));
};

Retriever.prototype._getBody = function _getBody(res) {
//   var debug = require('debug')('RssItemRetriever:_getBody');

   return new Promise(function(resolve, reject) {
      res.setEncoding('utf-8');
      var body = '';
      res.on('data', function(chunk) {

         if (body.length + chunk.length
          > module.exports.MAX_RESPONSE_BODY_SIZE) {

            // TODO kill res connection
            var errorCode = 'RESPONSE_BODY_EXCEEDED';
//            debug('%s %s', errorCode, this._options.url);
            reject(new RetrieverError(this, errorCode));
         } else {
            body += chunk;
         }
      });

      res.on('end', function() {
//         debug('body received %s', this._options.url);
         resolve(body);
      });

      res.on('error', function(e) {
         // TODO what kind of error?
         // TODO code
         // TODO kill res connection
         reject(e);
      });
   });
};

Retriever.prototype._extractChannels = function _extractChannels(xml) {
   return xml.rss.channel;
};
