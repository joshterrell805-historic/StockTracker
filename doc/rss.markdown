#### Tracking RSS Feeds

A program runs X times per day (cron job) that
1. Reads a list of feeds to track (user defined)
2. Compares that list to the list of feeds it is tracking
   - This list contains url, etag, and last modified
   - Elements from this list are added and removed to match the list from #1
   - If an element is added, the etag and lastModified are set to ''
3. Get the updated channels of each list
   - If the HEAD request was a 304, the channels were not updated
   - Otherwise the part or all of the channel may have been modified
4. Save all the updated channels to disk
   - updatedRssChannels/timestamp.json

Another cron task will be run which moves the updatedChannels files to a new
directory, compresses them into one file (removing unchanged) then sends the
channels to the backup server which perminately saves the channels.
