var cheerio = require('cheerio'),
    fs = require('fs'),
    Promise = require('promise');

var readFile = function() {
   var read = Promise.denodeify(fs.readFile);
   return function(path) {
      return read(path, {encoding: 'utf-8'});
   }
}();

readFile('ebolaArticle.html')
.then(function (html) {
   $ = cheerio.load(html);
   var paragraphs = $('p');
   var texts = paragraphs.map(function(i, elem) {
      return $(elem).text();
   }).get();
   console.dir(texts);
})
.done();
