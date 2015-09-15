query=`cat dump.sql | sed "s/@symbol/\"$1\"/g"`
mysql -u root --database stocks --raw -e "$query" > data/dumps/${1}.csv
