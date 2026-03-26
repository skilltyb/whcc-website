/**
 * WESTWOOD HILLS CC — Apps Script Additions for Dining Reservation Sync
 * ─────────────────────────────────────────────────────────────────────
 * Add these snippets to your existing Apps Script (script.google.com).
 *
 * STEP 1 — Paste the getOrCreateDiningSheet() helper anywhere in the file.
 * STEP 2 — Inside doPost(e), add the three new case blocks shown below.
 * STEP 3 — Inside doGet(e), add the one new case block shown below.
 * STEP 4 — Deploy > Manage deployments > New version, then click Deploy.
 */


// ── HELPER ────────────────────────────────────────────────────────────────────
// Returns the "Dining Reservations" sheet, creating it with headers if needed.
function getOrCreateDiningSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Dining Reservations');
  if (!sheet) {
    sheet = ss.insertSheet('Dining Reservations');
    sheet.appendRow([
      'ID', 'Date', 'Time', 'Time Display', 'Name',
      'Party Size', 'Notes', 'Status', 'Source', 'Submitted'
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}


// ── doPost ADDITIONS ──────────────────────────────────────────────────────────
// Inside your existing doPost(e) function, add these three cases to the
// switch statement (or if/else chain) that routes on body.action:

/*
    case 'dining-reservation':
      var dSheet = getOrCreateDiningSheet();
      dSheet.appendRow([
        body.id        || Utilities.getUuid(),
        body.date      || '',          // ISO date "YYYY-MM-DD"
        body.time24    || '',
        body.timeDisplay || '',
        body.name      || '',
        body.party     || 1,
        body.note      || '',
        'Pending',                     // initial status
        body.source    || 'member-app',
        body.submitted || new Date().toISOString()
      ]);
      return jsonResponse({ ok: true });

    case 'update-dining':
      var dSheet2 = getOrCreateDiningSheet();
      var dRows   = dSheet2.getDataRange().getValues();
      var dHdr    = dRows[0];
      var idCol   = dHdr.indexOf('ID');
      var statCol = dHdr.indexOf('Status');
      if (idCol < 0 || statCol < 0) return jsonResponse({ ok: false, error: 'columns missing' });
      for (var di = 1; di < dRows.length; di++) {
        if (String(dRows[di][idCol]) === String(body.id)) {
          dSheet2.getRange(di + 1, statCol + 1).setValue(body.status || 'Seated');
          return jsonResponse({ ok: true });
        }
      }
      return jsonResponse({ ok: false, error: 'not found' });
*/


// ── doGet ADDITION ────────────────────────────────────────────────────────────
// Inside your existing doGet(e) function, add this case:

/*
    case 'get-dining':
      var dSheet3  = getOrCreateDiningSheet();
      var dRows3   = dSheet3.getDataRange().getValues();
      if (dRows3.length < 2) return jsonResponse([]);
      var dHdr3    = dRows3[0];
      var filterDate = e.parameter.date || '';   // expected: "YYYY-MM-DD"
      var results  = [];
      for (var di3 = 1; di3 < dRows3.length; di3++) {
        var row3 = {};
        dHdr3.forEach(function(h, i) { row3[h] = dRows3[di3][i]; });
        // Filter by date if provided, skip cancelled
        if (row3['Status'] === 'Cancelled') continue;
        if (filterDate && String(row3['Date']).slice(0,10) !== filterDate) continue;
        results.push({
          id:          String(row3['ID']          || ''),
          date:        String(row3['Date']         || ''),
          time24:      String(row3['Time']         || ''),
          timeDisplay: String(row3['Time Display'] || ''),
          name:        String(row3['Name']         || ''),
          party:       Number(row3['Party Size']   || 1),
          note:        String(row3['Notes']        || ''),
          seated:      String(row3['Status']       || '') === 'Seated',
          source:      String(row3['Source']       || ''),
          submitted:   String(row3['Submitted']    || '')
        });
      }
      return jsonResponse(results);
*/


// ── UTILITY (add if not already in your script) ───────────────────────────────
// Most existing scripts already have something like this. If yours doesn't:
/*
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
*/
