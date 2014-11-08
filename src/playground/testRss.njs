var cheerio = require('cheerio'),
    Promise = require('promise'),
    fs = require('fs'),
    argv = require('minimist')(process.argv.slice(2)),
    http = require('http'),
    url = require('url'),
    xml2js = require('xml2js');

var parsedUrl = url.parse(argv.path);
var parseXml = Promise.denodeify(xml2js.parseString);

var req = http.request({
   hostname: parsedUrl.hostname,
   path: parsedUrl.path,
   // method: 'HEAD',
}, function(res) {
   // console.log('status code: ' + res.statusCode);
   // console.dir(res.headers);
    res.setEncoding('utf-8');

   var body = '';
   res.on('data', function(chunk) {
      body += chunk;
   });
   res.on('end', function() {
      parseXml(body).then(function(xml) {
         console.dir(xml.rss.channel[0].item);
         console.log('channels: ' + xml.rss.channel.length);
      }).done();
   });
   res.on('error', function(e) {
      throw e;
   });
});

req.on('error', function(e) {
   throw e;
});

//req.setHeader('If-None-Match', 'NB44i3dwwRCtYCM1D0Ovm/Fo+7c');
req.end();
