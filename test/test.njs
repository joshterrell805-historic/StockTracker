var temp = require('../RssRetriever.njs').temp;
/*
var xml2js = require('xml2js'),
    fs = require('fs'),
    Promise = require('promise');

var parseXml = Promise.denodeify(xml2js.parseString);

var readFile = function() {
   var read = Promise.denodeify(fs.readFile);
   return function(path) {
      return read(path, {encoding: 'utf-8'});
   }
}();

readFile('foxLatest.xml')
.then(parseXml)
.then(function(object) {
   console.dir(object.rss.channel[0].item);
})
.done();
*/

temp('/home/josh/repos/stocks/test/foxLatest.xml')
.done(function(hash) {
   console.dir(hash);
   console.log(hash.channels.length);
   console.dir(hash.channels[0].item[0]);
});
