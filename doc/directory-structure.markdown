# Directory Structure
<table>
  <tr>
    <th>directory</th>
    <th>description</th>
  </tr>
  <tr>
    <td>/doc</td>
    <td>project documents such as this one</td>
  </tr>
  <tr>
    <td>/data</td>
    <td>recorded data and meta data on how to record data (eg which symbols to record)</td>
  </tr>
  <td></td><td>
    <table>
      <tr>
        <th>directory</th>
        <th>description</th>
      </tr>
      <tr>
        <td>/data/historical</td>
        <td>a dump of a lot of histoical data from etrade going decades back</td>
      </tr>
      <tr>
        <td>/data/quotes</td>
        <td>recorded data about ticker symbols that hasn't been transfered to the storage server yet</td>
      </tr>
      <tr>
        <td>/data/rss</td>
        <td>recorded data about rss-feeds that hasn't been transfered to the storage server yet</td>
      </tr>
    </table>
  </td>
  <tr>
    <td>/log</td>
    <td>stats, errors, and other logging information</td>
  </tr>
  <tr>
    <td>/src</td>
    <td>source code</td>
  </tr>
  <tr>
    <td>/exec</td>
    <td>executables including recording data, syncing to backup server, and executing tests</td>
  </tr>
</table>

<style>
  table{
    border-spacing: 40px 20px;
  }
</style>
