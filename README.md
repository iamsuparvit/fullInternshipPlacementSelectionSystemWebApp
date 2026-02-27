# RxCU85 Internship Placement Selection System

A real-time dashboard for visualizing internship placement selections. This application tracks student selections across different internship sites and shifts, providing a clear overview of capacity and distribution.

## Features

- **Dashboard Overview**: View total selections and breakdown by shift (Shift 1, 2, and 3).
- **Capacity Tracking**: Monitor seat availability per site with visual indicators for capacity status (Green: Available, Amber: Full, Red: Over Capacity).
- **Search & Sort**: Easily find specific sites and sort data by name, shift counts, or total selections.
- **Responsive Design**: Optimized for both desktop and mobile viewing.
- **Real-time Data**: Fetches data directly from Google Sheets via Google Apps Script.

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Backend**: Google Apps Script (serves as API for Google Sheets)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Google Cloud Project (for deployment) or local environment
- Access to the Google Sheet containing the placement data

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rxcu85-placement-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory based on `.env.example`:
   ```env
   VITE_GOOGLE_SCRIPT_URL="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
   # Optional: If you implemented API key protection in your script
   VITE_API_KEY="your-api-key"
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## Google Apps Script Setup

This project requires a Google Apps Script backend to serve data from Google Sheets.

1. Open your Google Sheet, which contains the following columns:

| student_name | student_id | sex | Shift 1 | Rank 1 | Shift 2 | Rank 2 | Shift 3 | Rank 3 | Shift 4 | Rank 4 | Shift 5 | Rank 5 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| e3b0c442 | 66310XXX33 | Female | 1 | BTS02 | 1 | BTS04 | 1 | BTS05 | 1 | CEN05 | 1 | CEN01 |
| 8a7b6c5d | 66300XXX33 | Male | 1 | CEN17 | 1 | CHA01 | 2 | CHA01 | 1 | HPT04 | 2 | HPT04 |
| 9f8e7d6c | 66310XXX33 | Female | 1 | FCN92 | 1 | FCN86 | 1 | HPT03 | 1 | BKK02 | 1 | BKK28 |
| 1a2b3c4d | 66310XXX33 | Male | 1 | HPT04 | 2 | HPT04 | 1 | HPT01 | 2 | HPT03 | 2 | BTS14 |
| 5e6f7a8b | 66300XXX33 | Female | 1 | FCN30 | 1 | BTS05 | 1 | FCN67 | 1 | BTS04 | 1 | BTS16 |

3. Go to **Extensions > Apps Script**.
4. Paste the following code into `Code.gs`:

```javascript
const API_KEY = "YOUR_SECRET_KEY"; // Optional: For security

function doGet(e) {
  // Optional: Security check
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
    
    // Map columns
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
```

4. **Deploy the script**:
   - Click **Deploy > New deployment**.
   - Select type: **Web app**.
   - Description: "Internship API".
   - Execute as: **Me**.
   - Who has access: **Anyone**.
   - Click **Deploy**.
   - Copy the **Web App URL** and use it as `VITE_GOOGLE_SCRIPT_URL` in your `.env` file.

## Build for Production

To create a production build:

```bash
npm run build
```

The output will be in the `dist` directory.

## License

This project is licensed under the terms of the MIT License. For complete details, refer to the [LICENSE](LICENSE) file.
