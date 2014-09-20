/**
 * Get an array of market data for the specified symbols and indexes.
 */
module.exports = {
   Retriever: Retriever,
   retrieve: retrieve,
};

var Promise = require('promise'),
    http = require('http'),
    url = require('url'),
    Stats = require('./Stats.njs');

function retrieve(options) {
   var retriever = new Retriever(options);
   return retriever.retrieve();
}

function Retriever(options) {
   this._options = options;
}

/**
 * @resolve: an array of market data for the indexes and symbols
 */
Retriever.prototype.retrieve = function retrieve() {
   return this._getData();
};

/**
 * @resolve: an array of symbol data for all the requested symbols.
 *
 *
 */
Retriever.prototype._getData= function _getData() {
   var requests = Request.splitIntoRequests(this._options.symbols);
   var responsePs = requests.map(
    Request.prototype.execute.call.bind(Request.prototype.execute));
   // TODO concat responses and return
};

function Request(symbols) {
   this.symbols = symbols;
}

Request.MAX_SYMBOLS_PER_REQUEST = 25;
Request.MAX_REQUESTS_PER_INTERVAL = 4;
Request.RATE_LIMIT_INTERVAL = 1000;
Request.MAX_BODY_SIZE = 1024 * 1024 * 32; // sort of arbitrary 32 MiB
Request.quoteUrl = "https://etws.etrade.com/market/rest/quote/";
Request._queue = []; 
Request._lastRequested = [];

Request.splitIntoRequests = function splitIntoRequests(symbols) {
   // TODO splice or slice?
   symbols = symbols.splice();
   var requests = [];

   while (symbols.length) {
      var request = new Request(symbols.splice(0,
       Request.MAX_SYMBOLS_PER_REQUEST));
      requests.push(request);
   }

   return requests;
};

/**
 * Execute the request taking care not to overstep the api
 *  rate limits.. if the limit is overstepped, this function will make sure
 *  to wait the apropriate time to guarentee that the request doesn't fail due
 *  to rate limiting (it might fail because of the stock market being closed
 *  or something like that).
 *
 * @resolve: the response data from the api
 */
Request.prototype.execute = function execute() {
   var symbolStr = this.symbols.join(',');
   this._path = Request.quoteUrl + symbolStr;
   return this._addToQueue();
};

/**
 * Add a request to queue which will be requested when the rate limiting is
 *  done limiting.
 *
 * @resolve: promise for response data.
 */
Request.prototype._addToQueue = function _addToQueue() {
   return new Promise(function(resolve, reject) {
      this._resolve = resolve;
      this._reject = reject;
      Request._queue.push(this);
      Request._wakeQueue();
   }.bind(this));
};

/**
 * A new request was added or a request finished.
 */
Request._wakeQueue = function _wakeQueue() {
   // Remove any completed requests from the _lastRequested array that
   //  have been around for more than a a second.
   for (var i = 0; i < Request._lastRequested.length;) {
      var request = Request._lastRequested[i];

      if (request._isComplete && Date.now().getTime() -
       request._completeTimestamp > Request.RATE_LIMIT_INTERVAL) {
         Request._lastRequested.splice(i, 1);
      } else {
         ++i;
      }
   }

   // TODO assert never greater than 4
   var requestsAvailable = Request.MAX_REQUESTS_PER_INTERVAL -
    Request._lastRequested.length;

   if (Request._queue.length > 0 && requestsAvaialble == 0) {
      return setTimeout(Request._wakeQueue, 100);
   }

   while (Request._queue.length > 0 && requestsAvailable > 0) {
      var request = Request._queue.shift();
      Request._lastRequested.push(request);

      request._send()
      .done(function(response) {
         this._complete = true;
         this._completeTimestamp = Date.now().getTime();
         process.nextTick(Request._wakeQueue);

         if (response.statusCode == 200) {
            this._resolve(this._getBody(response));
         } else {
            // TODO unauthorized? too many requests? what?
            this._reject(new Error('invalid status code'));
         }
      }.bind(request),
      function(err) {
         this._complete = true;
         this._completeTimestamp = Date.now().getTime();
         process.nextTick(Request._wakeQueue);
         // TODO the request failed... try again?
         this._reject(err);
      }.bind(request));

      --requestsAvialable;
   }
};

/**
 * Actually send a request to the api.
 *
 * @resolve: the http.Response
 * @reject: an error that occured while making the request
 */
Request.prototype._send = function _send() {
//   var debug = require('debug')('MarketRetriever:_send')
   return new Promise(function(resolve, reject) {
      var parsed = url.parse(this._path);
      var options = {
         hostname: parsed.hostname,
         path: parsed.path,
      };

      var req = http.request(options, resolve);

      // TODO close connection ?
      req.on('error', reject);

//      debug('%s %s', method, path);

      // TODO auth headers
      req.end();

   }.bind(this));
};

Request.prototype._getBody = function _getBody(res) {
   return new Promise(function(resolve, reject) {
      res.setEncoding('utf-8');
      var body = '';

      res.on('data', function(chunk) {

         if (body.length + chunk.length > Request.MAX_RESPONSE_BODY_SIZE) {

            // TODO kill res connection
            var errorCode = 'RESPONSE_BODY_EXCEEDED';
            var e = new Error('Buffer exceeded limit while receiving body of '
             + 'api response');
            e.code = 'RESPONSE_BODY_EXCEEDED';
//            debug('%s %s', errorCode, this._options.url);
            reject(e);
         } else {
            body += chunk;
         }
      });

      res.on('end', function() {
//         debug('body received %s', this._options.url);
         resolve(body);
      });

      // TODO what kind of error?
      // TODO code
      // TODO kill res connection
      res.on('error', reject);
   });
};
