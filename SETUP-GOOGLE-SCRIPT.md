# Setting Up Google Apps Script for Event Registrations

## Step 1: Create the Google Sheet
1. Go to sheets.google.com
2. Create a new spreadsheet named "WHCC Event Registrations"
3. Add headers in Row 1:
   ID | Event | Event Date/Time | First Name | Last Name | Email | Phone | Partner | Players | Member # | Notes | Registered At | Source

## Step 2: Create the Apps Script
1. In the spreadsheet, go to Extensions → Apps Script
2. Delete the default code and paste:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.id, data.event, data.eventMeta, data.firstName, data.lastName,
    data.email, data.phone, data.partner, data.players, data.memberNum,
    data.notes, data.timestamp, data.source
  ]);
  return ContentService.createTextOutput(JSON.stringify({status:'ok'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var data = rows.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h,i){ obj[h]=row[i]; });
    return obj;
  });
  var eventFilter = e.parameter.event;
  if (eventFilter) data = data.filter(function(r){ return r.Event === eventFilter; });
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Click Deploy → New Deployment
4. Type: Web App
5. Execute as: Me
6. Who has access: Anyone
7. Click Deploy → Copy the Web App URL

## Step 3: Update the website
In index.html, find:
  var WHCC_SCRIPT_URL = 'https://script.google.com/macros/s/WHCC_SCRIPT_ID/exec';
Replace WHCC_SCRIPT_ID with your actual script ID from the URL.

## Golf Genius Integration
Golf Genius accepts CSV imports. Use the "⬇ CSV" button in the staff portal
Registrations tab to download a CSV, then import it into Golf Genius under
Tournament → Field → Import Players.
