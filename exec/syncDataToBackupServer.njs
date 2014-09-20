/**
 * This script is responsible for syncing the temporarily stored data to the
 *  backup server.
 *
 * Stock data is recorded all day, and rss feeds are tracked all day.
 * However, there is very limited space available on the server.
 *
 * This script runs on a daily basis, takes all the temporary data stored
 *  on this server and moves it to the backup server.
 *
 * This script isn't very important to get done now, as there is enough room
 *  on disk to store weeks maybe even months worth of data before filling to
 *  capacity.
 */
