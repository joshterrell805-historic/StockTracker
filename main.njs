var console = require("console");
var mysql = require("mysql");
var exec = require('child_process').exec;

/**
 * Get which symbols should be recorded.
 *
 * @return an array of objects with the fields id and name where id is the
 *  (local only) id of this symbol and name is the ticker symbol
 */
function getSymbols(callback)
{
   connection.query("select id, name from symbol", function(err, rows)
   {
      if (err)
      {
         throw err;
      }

      callback(rows);
   });

}


/**
 * Query some stock api (like yahoo's) and get the symbol data for the specified
 *  symbols.
 *
 * @param symbols a collection of ticker-symbols to obtain values for.
 * @param callback a callback to be called with a collection of a collection of
 *  values for each of the ticker-symbols in symbols.
 */
function getSymbolData(symbols, callback)
{
   var symbolsString = "";

   //console.log(symbols);

   var first = true;
   for (var i = 0; i < symbols.length; ++i)
   {
      if (first)
      {
         first = false;
         symbolsString += symbols[i].name;
      }
      else
      {
         symbolsString += "+" + symbols[i].name;
      }
   }

   var command = "http get http://download.finance.yahoo.com/d/quotes.csv?s="
   // if f (format specifier) changes, the constant value 4 in storeSymbolData
   //  must be changed too.
      + symbolsString + "\\&f=sb2b3l1 -b < /dev/null";

   var child = exec(command, function(err, stdout, stderr)
   {
      if (!err)
      {
         var symbolData = stdout.toString().split("\r\n");

         // yahoo provides an extra newline which makes the last element empty
         if (symbolData[symbolData.length - 1] == "")
         {
            // remove it
            symbolData.splice(symbolData.length - 1, 1);
         }
      }

      callback(err, symbolData);
   });
}

/**
 * Create a string representation of <value> zero-padded to <digits> digits.
 * <value> and <digits> must be ints.
 */
function prefixZeros(digits, value)
{

   var prefixedString = "";
   var tempValue = value;

   while (--digits)
   {
      tempValue /= 10;

      if (!tempValue)
      {
         prefixedString += "0";
      }
   }

   return prefixedString + value;
}

/**
 * Store the symbol data in the database.
 */
function storeSymbolData(symbols, symbolData)
{
   //console.log(symbols);
   //console.log(symbolData);

   // sanity check

   var stamp = new Date();

   if (symbols.length != symbolData.length)
   {
      console.log("Warning: there is an incomplete or excess amount of "
         + "symbolData.");
   }

   var query = "insert into stamp (stamp) values ("
      + "\"" + stamp.getUTCFullYear() + "-"
      + prefixZeros(2, stamp.getUTCMonth() + 1) + "-"
      + prefixZeros(2, stamp.getUTCDate()) + " "
      + prefixZeros(2, stamp.getUTCHours()) + ":"
      + prefixZeros(2, stamp.getUTCMinutes()) + ":"
      + prefixZeros(2, stamp.getUTCSeconds()) + "\")";

   connection.query(query, function(err, rows)
   {
      if (err)
      {
         throw err;
      }

      var stampId = rows.insertId;

      for (var i = 0; i < symbols.length; ++i)
      {
         if (!symbolData[i])
         {
            console.log("Symbol data for " + symbols[i] + " is missing.");
            if (!symbolData.length)
            {
               console.log("Actually, the problem is that nothing was returned.");
            }
            else
            {
               console.log("None of the stocks will be logged for this mintue until this code is fixed :(");
            }

            continue;
         }

         var data = symbolData[i].split(",");
         // currently yahoo surrounds symbol names in quotes
         if (data[0].charAt(0) == "\"")
         {
            data[0] = data[0].substring(1, data[0].length - 1);
         }

         if (data[0] == symbols[i].name)
         {
            // 4 is the number of format specifiers. If I ever get around to
            //  sexying this up, this won't be a constant. But for now I just
            //  want to start logging data.
            if (data.length == 4)
            {
               var ask = isNaN(parseInt(data[1])) ? null : data[1];
               var bid = isNaN(parseInt(data[2])) ? null : data[2];
               var lastTrade = isNaN(parseInt(data[3])) ? null : data[3];

               var query = "insert into record "
                  + "(symbolId, stampId, askReal, bidReal, lastTrade) "
                  + "values ("
                  + symbols[i].id + ", "
                  + stampId + ", "
                  + (ask ? ask : "NULL") + ", "
                  + (bid ? bid : "NULL") + ", "
                  + (lastTrade ? lastTrade : "NULL") + ")";

               connection.query(query, function(err, rows)
               {
                  if (err)
                  {
                     throw err;
                  }
               });
            }
            else
            {
               console("Error: expected 4 data values for " + data[0]);
            }

         }
         else
         {
            console.log("Error: " + symbols[i].name
               + " does not have maching symbol data.");
         }
      }

   });
}


// main

var connection = mysql.createConnection({
   host:"localhost",
   user:"admin",
   password:"ThereIS_aBuRRiTO(:",
   database:"stocks"
});

connection.connect();

var symbols;
getSymbols(function(symbols)
{
   global.symbols = symbols;
   setInterval(loop, 60000);
   loop();
});

var errCount = 0;
var maxConsecErrors = 10;

function loop()
{
   var now = new Date();
   /* NYSE and NASDAQ are open from 9:30am to 4:00pm EST
    * I'm not sure how daylight savings works over there; I'll just add an extra
    *  hour fluff .. that's 8:30am to 5:00pm EST
    * NYSE +3 hours from here, or PST is -3 from NYSE so the time is
    * 5:30am to 2:00pm PST
    * to make it easy.. just do  5am to 2pm
    */

   // must not be saturday or sunday
   if (now.getDay() != 0 && now.getDay() != 6
   // between 5am and 2pm
      && now.getHours() >= 5 && now.getHours() < 14)
   {
      getSymbolData(global.symbols, function(err, symbolData)
      {
         if (err)
         {
            if (++errCount == maxConsecErrors)
            {
               throw err;
            }
            else
            {
               console.log("consecuative errors: " + errCount);
               console.log((new Date()).toString());
               console.log(err.toString());
            }
         }
         else
         {
            errCount = 0;
            storeSymbolData(global.symbols, symbolData);
         }
      });
   }
   else
   {
      // I'm not sure if the connection will die if it's not used.. use it
      // just in case. It doesn't really matter for now.
      connection.query("describe symbol", function(err, rows)
      {
         if (err)
         {
            throw err;
         }
      });
   }
   
}
