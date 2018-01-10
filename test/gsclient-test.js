var GoogleSheetClient = require('../gsclient');
var googleSheetClient = new GoogleSheetClient('./key.json');
/*
googleSheetClient.update('1b4SOJGNRtJqmN2b-ZvD9JQZcNCKYVe3btSxVFTK8Zs0', 'Foglio2!A3', 'Test!', function(err, resp){
  console.log(err);
  console.log(resp);
});
*/
googleSheetClient.updateAndNote('1b4SOJGNRtJqmN2b-ZvD9JQZcNCKYVe3btSxVFTK8Zs0',null, 5, 'Test note', 0, 1, 1, function(err, resp){
  console.log(err);
  console.log(resp);
});
