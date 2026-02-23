const API_KEY = "YOUR_SECRET_KEY"; // Replace with your actual key defined in .env

function doGet(e) {
  // Optional: Check API Key if provided in request
  // If you want to enforce security, change "YOUR_SECRET_KEY" to your actual key and uncomment the check
  /*
  if (API_KEY !== "YOUR_SECRET_KEY" && (!e.parameter.key || e.parameter.key !== API_KEY)) {
     return ContentService.createTextOutput(JSON.stringify({error: "Invalid API Key"}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  */

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Get Responses from "Form Responses 1"
  var responseSheet = ss.getSheetByName("Form Responses 1");
  // Fallback to first sheet if name doesn't match exactly, but prefer specific name
  if (!responseSheet) responseSheet = ss.getSheets()[0];
  
  var responseData = responseSheet.getDataRange().getValues();
  var responses = [];
  
  if (responseData.length > 0) {
    var headers = responseData[0];
    var shiftIndex = headers.indexOf("Shift");
    var rank1Index = headers.indexOf("Rank 1");
    var rank2Index = headers.indexOf("Rank 2");
    var rank3Index = headers.indexOf("Rank 3");
    var rank4Index = headers.indexOf("Rank 4");
    var rank5Index = headers.indexOf("Rank 5");
    
    for (var i = 1; i < responseData.length; i++) {
      var row = responseData[i];
      if (row[shiftIndex]) {
        responses.push({
          shift: String(row[shiftIndex]),
          rank1: row[rank1Index],
          rank2: row[rank2Index],
          rank3: row[rank3Index],
          rank4: row[rank4Index],
          rank5: row[rank5Index]
        });
      }
    }
  }
  
  // 2. Get Capacities from "availableSeats"
  var capacitySheet = ss.getSheetByName("availableSeats");
  var capacities = [];
  
  if (capacitySheet) {
    var capData = capacitySheet.getDataRange().getValues();
    if (capData.length > 0) {
      var capHeaders = capData[0];
      // Columns: code, branch, code + branch, sex_require1, seat1, sex_require2, seat2, sex_require3, seat3
      var nameIndex = capHeaders.indexOf("code + branch");
      var seat1Index = capHeaders.indexOf("seat1");
      var seat2Index = capHeaders.indexOf("seat2");
      var seat3Index = capHeaders.indexOf("seat3");
      
      // If columns are found
      if (nameIndex > -1) {
        for (var i = 1; i < capData.length; i++) {
          var row = capData[i];
          if (row[nameIndex]) {
            capacities.push({
              name: String(row[nameIndex]),
              seat1: row[seat1Index] === "" ? 0 : Number(row[seat1Index]),
              seat2: row[seat2Index] === "" ? 0 : Number(row[seat2Index]),
              seat3: row[seat3Index] === "" ? 0 : Number(row[seat3Index])
            });
          }
        }
      }
    }
  }
  
  var result = {
    responses: responses,
    capacities: capacities
  };
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
