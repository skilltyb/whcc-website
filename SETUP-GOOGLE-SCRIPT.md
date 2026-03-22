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
// ── HELPERS ──────────────────────────────────────────────────────────────────
function getRegSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
}

function getTeeSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Tee Sheets');
  if (!sh) {
    sh = ss.insertSheet('Tee Sheets');
    sh.appendRow(['Event','Round','Date','Config','Groups','Saved At']);
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,6).setBackground('#1a4726').setFontColor('#f5f0e8').setFontWeight('bold');
    sh.setColumnWidth(1,180); sh.setColumnWidth(4,80); sh.setColumnWidth(5,60); sh.setColumnWidth(6,160);
  }
  return sh;
}

// ── POST ─────────────────────────────────────────────────────────────────────
function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  // Clear test entries
  if (data.action === 'clear-test') {
    var sh = getRegSheet();
    var rows = sh.getDataRange().getValues();
    var toDelete = [];
    for (var i = rows.length - 1; i >= 1; i--) {
      if (String(rows[i][12]).toLowerCase() === 'website') toDelete.push(i + 1);
    }
    toDelete.forEach(function(r){ sh.deleteRow(r); });
    return ContentService.createTextOutput(JSON.stringify({status:'cleared'}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Delete a single registration
  if (data.action === 'delete') {
    var sh = getRegSheet();
    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.id) { sh.deleteRow(i + 1); break; }
    }
    return ContentService.createTextOutput(JSON.stringify({status:'deleted'}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Save tee sheet (event+round — overwrites existing row)
  if (data.action === 'save-teesheet') {
    var sh = getTeeSheet();
    var rows = sh.getDataRange().getValues();
    var found = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.event && String(rows[i][1]) === String(data.round)) {
        found = i + 1; break;
      }
    }
    var rowData = [data.event, data.round, data.date,
                   JSON.stringify(data.config || {}),
                   JSON.stringify(data.groups || []),
                   new Date().toISOString()];
    if (found > 0) sh.getRange(found, 1, 1, 6).setValues([rowData]);
    else           sh.appendRow(rowData);
    return ContentService.createTextOutput(JSON.stringify({status:'ok'}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Save scores for a specific event+round
  if (data.action === 'save-scores') {
    var sh = getTeeSheet();
    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.event && String(rows[i][1]) === String(data.round)) {
        var groups = JSON.parse(rows[i][4] || '[]');
        (data.scores || []).forEach(function(upd) {
          for (var j = 0; j < groups.length; j++) {
            if (String(groups[j].id) === String(upd.groupId)) {
              if (!groups[j].scores) groups[j].scores = {};
              groups[j].scores['r' + data.round] = upd.score;
              break;
            }
          }
        });
        sh.getRange(i + 1, 5).setValue(JSON.stringify(groups));
        sh.getRange(i + 1, 6).setValue(new Date().toISOString());
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({status:'ok'}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Default: save registration
  getRegSheet().appendRow([
    data.id, data.event, data.eventMeta, data.firstName, data.lastName,
    data.email, data.phone, data.partner, data.players, data.memberNum,
    data.ghin, data.notes, data.timestamp, data.source
  ]);
  return ContentService.createTextOutput(JSON.stringify({status:'ok'}))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── GET ──────────────────────────────────────────────────────────────────────
function doGet(e) {
  // Return tee sheets
  if (e.parameter.action === 'get-teesheets') {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tee Sheets');
    if (!sh) return ContentService.createTextOutput('[]').setMimeType(ContentService.MimeType.JSON);
    var rows = sh.getDataRange().getValues().slice(1);
    var data = rows.filter(function(r){ return r[0]; }).map(function(r) {
      return { event: r[0], round: Number(r[1]), date: r[2],
               config: JSON.parse(r[3] || '{}'), groups: JSON.parse(r[4] || '[]'),
               savedAt: r[5] ? new Date(r[5]).toISOString() : '' };
    });
    if (e.parameter.event) data = data.filter(function(d){ return d.event === e.parameter.event; });
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Return registration counts per event
  if (e.parameter.action === 'counts') {
    var sh = getRegSheet();
    var rows = sh.getDataRange().getValues().slice(1);
    var counts = {};
    rows.forEach(function(r){ if (r[1]) counts[r[1]] = (counts[r[1]] || 0) + 1; });
    return ContentService.createTextOutput(JSON.stringify(counts))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Default: return all registrations
  var sh = getRegSheet();
  var rows = sh.getDataRange().getValues();
  var headers = rows[0];
  var data = rows.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i){ obj[h] = row[i]; });
    return obj;
  });
  if (e.parameter.event) data = data.filter(function(r){ return r['Event'] === e.parameter.event; });
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

## Step 4: Tee Sheet Sync

After updating the Apps Script, the website and mobile app can save and load tee sheets:
- The Apps Script auto-creates a "Tee Sheets" tab in your spreadsheet
- Saving a tee sheet from the website/mobile app writes to that tab
- All three platforms read from the same tab, so they stay in sync
- Scores entered in any platform update the same row in the sheet
