# Stock Tracker
**Gather data** to later analyze for market trends which peredict stock-prices.

Another application will be made for analyzing the data this application produces.

## Documents
- [Data To Record](data-to-record.html)
- [Tracking RSS Feeds](tracking-rss-feeds.html)
- [Recording Market Data](recording-market-data.html)
- [Directory Structure](directory-structure.html)

## Brief overview
The goal of this app is to **record stock data** that I can later analyze.

I will be analyzing the stock data to develop algorithms to predict stock prices.

### Influences on users of the stock market.
This application seeks to record the key influences on stock market users' decisions to buy and sell stocks.

So what most influences the decisions to buy and sell stocks?

I believe that **news** and **historical market data** are very influencial in peoples' decisions to buy and sell stocks.

As such, this application seeks to record the news and historical market data.

### Scope and Limitations
#### Stablity Stocks Only 
This application is focused on data influencing users who buy relatively stable stocks (as opposed to say, penny stocks which fluctuate rapidly). Why? Because I am unable to record data at a very fast rate. I am using a free api to gather stock data, and I don't want to record terrabytes of data-points. I'll assume that most users hold onto stocks for at least a day, so the resolution of my market data collection may be, say some significant fraction of a day.
