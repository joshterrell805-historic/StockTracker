select (select symbol from symbols where id = q.symbol) as symbol,
    unix_timestamp(q.ts) as `timestamp`, q.last_trade as price
from quotes q
where q.symbol = (select id from symbols where symbol = @symbol);
