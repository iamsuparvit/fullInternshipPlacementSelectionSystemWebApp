const API_KEY = "YOUR_SECRET_KEY"; // Replace with your actual key defined in .env

function doGet(e) {
  // Optional: Check API Key if provided in request
  /*
  if (API_KEY !== "YOUR_SECRET_KEY" && (!e.parameter.key || e.parameter.key !== API_KEY)) {
     return ContentService.createTextOutput(JSON.stringify({error: "Invalid API Key"}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  */

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Get Responses from "Form Responses 1"
  var responseSheet = ss.getSheetByName("Form Responses 1");
  if (!responseSheet) responseSheet = ss.getSheets()[0];
  
  var responseData = responseSheet.getDataRange().getValues();
  var responses = [];
  
  if (responseData.length > 0) {
    var headers = responseData[0];
    
    // Map columns based on user request
    var shiftRank1Index = headers.indexOf("Shift for Rank 1");
    var rank1Index = headers.indexOf("Rank 1");
    var shiftRank2Index = headers.indexOf("Shift for Rank 2");
    var rank2Index = headers.indexOf("Rank 2");
    var shiftRank3Index = headers.indexOf("Shift for Rank 3");
    var rank3Index = headers.indexOf("Rank 3");
    var shiftRank4Index = headers.indexOf("Shift for Rank 4");
    var rank4Index = headers.indexOf("Rank 4");
    var shiftRank5Index = headers.indexOf("Shift for Rank 5");
    var rank5Index = headers.indexOf("Rank 5");
    
    for (var i = 1; i < responseData.length; i++) {
      var row = responseData[i];
      // Only push if we have at least Rank 1 data
      if (row[rank1Index]) {
        responses.push({
          shiftRank1: row[shiftRank1Index],
          rank1: row[rank1Index],
          shiftRank2: row[shiftRank2Index],
          rank2: row[rank2Index],
          shiftRank3: row[shiftRank3Index],
          rank3: row[rank3Index],
          shiftRank4: row[shiftRank4Index],
          rank4: row[rank4Index],
          shiftRank5: row[shiftRank5Index],
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
