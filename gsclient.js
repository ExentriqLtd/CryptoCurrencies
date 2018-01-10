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

  updateAndNote(spreadsheetId, value, note, sheetId, row, col, callback){
    var jwtClient = this.jwtClient;
    jwtClient.authorize(function (err, tokens) {
      if (err) {
        console.log(err);
        return;
      }

      var requests = [];
      requests.push({
        "repeatCell": {
          "range": {
            "sheetId": sheetId,
            "startRowIndex": row,
            "endRowIndex": row+1,
            "startColumnIndex": col,
            "endColumnIndex": col+1
          },
          "cell": {
            note: note,
            userEnteredValue: {"stringValue":value}
          },
          "fields": "note, userEnteredValue"
        }
      });


      sheets.spreadsheets.batchUpdate({
        auth: jwtClient,
        spreadsheetId: spreadsheetId,
        resource:{requests: requests}
      }, callback);

    });

  }

}

module.exports = GoogleSheetClient;
