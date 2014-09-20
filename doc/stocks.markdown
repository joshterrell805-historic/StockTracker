Parallel with recording latest RSS feeds, I am recording data about the stock market itself.

The data I am collecting includes market data about individual ticker symbols, and index data.

Every minute I gather a point on a graph for around one hundred ticker symbols and several stock indexes.

I'm planning on using ETrade's API, but I may use another too. Regardless of API, I want to gather all of the data possible to gather about each ticker symbol and each index every minute.

Then, just like the rss feeds, I will flush all the recorded data to the backup server every day or so.

### Rate limiting

From what I read thus far, it looks like I can make 4 requests per second to the ETrade Market API (where I will get symbol info from). Each request may include 25 symbols.. So I'll have to get the 200 requests over 2 seconds which should be fine, but that's something to think about if I ever want to get a lot of symbol data.
