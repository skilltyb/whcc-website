/**
 * WESTWOOD HILLS CC — Apps Script Additions for Dining Reservation Sync
 * ─────────────────────────────────────────────────────────────────────
 * Add these snippets to your existing Apps Script (script.google.com).
 *
 * STEP 1 — Paste the getOrCreateDiningSheet() and diningDateStr_() helpers
 *           anywhere in the file (outside of doPost/doGet).
 * STEP 2 — Inside doPost(e), add the two new case blocks shown below.
 * STEP 3 — Inside doGet(e), add the one new case block shown below.
 * STEP 4 — Deploy > Manage deployments > New version, then click Deploy.
 */


// ── HELPERS ───────────────────────────────────────────────────────────────────

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

// Safely converts a cell value (Date object OR string) to "YYYY-MM-DD".
// Google Sheets auto-parses date-like strings (e.g. "2026-03-25") into Date
// objects when you call getValues(), so String(v).slice(0,10) returns garbage
// like "Wed Mar 25". Always use this helper for the Date and Submitted columns.
function diningDateStr_(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(v || '').slice(0, 10);
}

// Normalises status to Title Case so comparisons stay consistent regardless
// of how the client sent it ('seated', 'Seated', 'SEATED' all → 'Seated').
function diningNormStatus_(s) {
  if (!s) return 'Pending';
  var t = String(s).trim();
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}


// ── doPost ADDITIONS ──────────────────────────────────────────────────────────
// Inside your existing doPost(e) function, add these two cases to the
// switch statement (or if/else chain) that routes on body.action:

/*
    case 'dining-reservation':
      var dSheet = getOrCreateDiningSheet();
      dSheet.appendRow([
        body.id          || Utilities.getUuid(),
        body.date        || '',          // stored as plain string "YYYY-MM-DD"
        body.time24      || '',
        body.timeDisplay || '',
        body.name        || '',
        body.party       || 1,
        body.note        || '',
        'Pending',                       // initial status
        body.source      || 'member-app',
        body.submitted   || new Date().toISOString()
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
          // Normalise to Title Case so get-dining comparisons are consistent
          // ('seated' from client → 'Seated' in sheet, 'cancelled' → 'Cancelled', etc.)
          dSheet2.getRange(di + 1, statCol + 1).setValue(diningNormStatus_(body.status));
          return jsonResponse({ ok: true });
        }
      }
      return jsonResponse({ ok: false, error: 'not found' });
*/


// ── doGet ADDITION ────────────────────────────────────────────────────────────
// Inside your existing doGet(e) function, add this case:

/*
    case 'get-dining':
      var dSheet3    = getOrCreateDiningSheet();
      var dRows3     = dSheet3.getDataRange().getValues();
      if (dRows3.length < 2) return jsonResponse([]);
      var dHdr3      = dRows3[0];
      var filterDate = e.parameter.date || '';   // expected: "YYYY-MM-DD"
      var results    = [];
      for (var di3 = 1; di3 < dRows3.length; di3++) {
        var row3 = {};
        dHdr3.forEach(function(h, i) { row3[h] = dRows3[di3][i]; });

        // Normalise status for all comparisons (Sheets may store mixed case if
        // rows were hand-edited).
        var status = diningNormStatus_(row3['Status']);

        // Skip cancelled rows; filter to requested date if provided.
        if (status === 'Cancelled') continue;
        // diningDateStr_() handles the case where Sheets auto-converted the
        // stored "YYYY-MM-DD" string into a Date object via getValues().
        if (filterDate && diningDateStr_(row3['Date']) !== filterDate) continue;

        results.push({
          id:          String(row3['ID']          || ''),
          date:        diningDateStr_(row3['Date']),          // safe ISO string
          time24:      String(row3['Time']         || ''),
          timeDisplay: String(row3['Time Display'] || ''),
          name:        String(row3['Name']         || ''),
          party:       Number(row3['Party Size']   || 1),
          note:        String(row3['Notes']        || ''),
          seated:      status === 'Seated',                   // normalised compare
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
