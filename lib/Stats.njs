module.exports = {
   record: record,
}

/**
 * Record an event by id, optionally including a data object to be JSON encoded
 */
function record(id, data, timestamp) {
   var event = {
      id: id,
      data: data,
      timetamp: timestamp === undefined ? Date.now() : timestamp,
   };

   console.dir(event);
}
