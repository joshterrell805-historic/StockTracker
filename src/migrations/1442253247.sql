drop table quotes;

create table quotes (
  symbol int not null,
  ts timestamp not null,
  ask decimal(9,5),
  ask_rt decimal(9,5),
  ask_size int,
  bid decimal(9,5),
  bid_rt decimal(9,5),
  bid_size int,
  volume int,
  last_trade decimal(9,5),
  last_trade_rt decimal(9,5),
  foreign key (symbol) references symbols(id),
  primary key (symbol, ts)
);
