var google = require('googleapis');
var sheets = google.sheets('v4');

class GoogleSheetClient {

  constructor(keyPath){

    var key = require(keyPath);

    this.jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      ['https://www.googleapis.com/auth/spreadsheets'],
      null
    );
  }

  /*
  */
  update(spreadsheetId, range, value, callback){
    var jwtClient = this.jwtClient;
    jwtClient.authorize(function (err, tokens) {
      if (err) {
        console.log(err);
        return;
      }

      sheets.spreadsheets.values.update({
        auth: jwtClient,
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        resource:{values: [[value]]}
      }, callback);

    });

  }

}

module.exports = GoogleSheetClient;
