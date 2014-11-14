module.exports = {
   record: record,
}

var fs = require('fs'),
    util = require('util');
// TODO this should be specified elsewhere.
var logPath = 'log/stats.log';

/**
 * Record an event by id, optionally including a data object to be JSON encoded
 */
function record(id, data, timestamp) {
   var event = {
      id: id,
      data: data,
      timestamp: timestamp === undefined ? Date.now() : timestamp,
   };

   log(event);
}

var fd = fs.openSync(logPath, 'w');
function log(event) {
   // var dataStr = event.data ? util.inspect(event.data, {depth: null}) : '';
   var dataStr = event.data ? JSON.stringify(event.data) : '';
   var str = (new Date(event.timestamp)).toISOString()
    + ' (' + event.id + ') '
    + dataStr
    + '\n'

   fs.writeSync(fd, str);
}
