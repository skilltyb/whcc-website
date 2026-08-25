function setupBoardPin() {
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var sh   = ss.getSheetByName('Settings');
  if (!sh) sh = ss.insertSheet('Settings');
  sh.getRange('A1').setValue('Board Recovery Code');
  sh.getRange('B1').setValue('WHCC-BOARD-2026');
  sh.getRange('A1').setFontWeight('bold');
  sh.setColumnWidth(1, 200);
  sh.setColumnWidth(2, 240);
  SpreadsheetApp.getUi().alert('Settings sheet ready!\n\nRecovery code: WHCC-BOARD-2026\n\nChange cell B1 to your preferred code before sharing with the Board.');
}

function makeStaffMember() {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var sh  = ss.getSheetByName('App Users');
  var rows = sh.getDataRange().getValues();
  var hdr  = rows[0];
  var eCol = hdr.indexOf('Email');
  var rCol = hdr.indexOf('Role');
  var nCol = hdr.indexOf('Name');
  var mCol = hdr.indexOf('Member Number');
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][eCol]).toLowerCase() === 'sctr1217@gmail.com') {
      sh.getRange(i+1, rCol+1).setValue('both');
      sh.getRange(i+1, nCol+1).setValue('Scott Borkgren');
      sh.getRange(i+1, mCol+1).setValue('A0000682-000');
      Logger.log('Updated to dual-role: ' + rows[i][eCol]);
      return;
    }
  }
  Logger.log('Account not found.');
}

function normMemberNum_(s) {
  var str = String(s || '').trim().toUpperCase().replace(/^[A-Z]+/, '').split('-')[0];
  return parseInt(str, 10) || 0;
}

function setupMembers() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Members') || ss.insertSheet('Members');
  if (sh.getLastRow() < 1) {
    sh.appendRow(['Member Number','First Name','Last Name','Email','Membership','Handicap']);
    sh.setFrozenRows(1);
  }
  if (sh.getLastRow() < 2) {
    sh.appendRow(['A0000682-000','Scott','Borkgren','','Full Membership','']);
  }
  Logger.log('Members sheet ready. Add remaining members to the sheet.');
}

function setupAppUsers() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('App Users') || ss.insertSheet('App Users');
  if (sh.getLastRow() < 1) {
    sh.appendRow(['Email','PIN','Role','Name','Title','Member Number','Membership','Handicap']);
    sh.setFrozenRows(1);
  }
  if (sh.getLastRow() < 2) {
    sh.appendRow(['sctr1217@gmail.com','4827','staff','General Manager','General Manager','','','']);
  }
  Logger.log('Done - App Users sheet ready.');
}

// Run this ONCE from the Apps Script editor (select it in the function
// dropdown, click Run) to wipe test/demo data before going live for real
// members. Clears data rows but keeps headers and sheet structure intact —
// nothing is deleted from Drive, and Sheets version history (File > Version
// history) can still recover anything if needed.
function clearTestAndDemoData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetsToClear = [
    'Registrations', 'Dining Reservations', 'Tee Sheets',
    'St. Pattys', 'Ladies Opening', 'Ozark Inv', 'Spring 2-Man', 'Ladies Sweet',
    'Masters Dinner', 'Couples', 'Ladies Inv', 'Mules Inv', 'MGA Draft',
    'Mens Opening', '4th of July', 'Member-Guest', 'Club Champ', 'Ladies Champ',
    'Fall 2-Man', 'Senior', 'Closing Day', 'Halloween'
  ];
  var cleared = [];
  sheetsToClear.forEach(function(name) {
    var sh = ss.getSheetByName(name);
    if (!sh) return;
    var lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).clearContent();
      cleared.push(name + ' (' + (lastRow - 1) + ' rows)');
    }
  });
  var msg = cleared.length ? cleared.join('\n') : 'Nothing to clear — all target sheets were already empty.';
  Logger.log('Cleared: ' + msg);
  SpreadsheetApp.getUi().alert('Cleared test/demo data from:\n\n' + msg);
}

// Run this ONCE from the Apps Script editor to move pre-launch test
// reservations/registrations/RSVPs out of the live sheets without deleting
// anything — each row moves to a same-named "<Sheet> Archive" sheet (created
// if missing), keeping headers intact. Only rows whose own timestamp column
// is before ARCHIVE_CUTOFF_DATE_ move; everything from that date forward is
// left alone as real data. Safe to re-run — already-archived rows are gone
// from the source sheet so they won't be picked up twice.
var ARCHIVE_CUTOFF_DATE_ = '2026-08-23';

function archivePreLaunchTestData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cutoff = new Date(ARCHIVE_CUTOFF_DATE_ + 'T00:00:00');
  var targets = [
    { sheet: 'Registrations',       dateCol: 'Registered At' },
    { sheet: 'Dining Reservations', dateCol: 'Submitted' },
    { sheet: 'Event RSVPs',         dateCol: 'Timestamp' },
    { sheet: 'League Regs',         dateCol: 'Timestamp' }
  ];
  var summary = [];
  targets.forEach(function(t) {
    var sh = ss.getSheetByName(t.sheet);
    if (!sh || sh.getLastRow() < 2) return;
    var values  = sh.getDataRange().getValues();
    var hdr     = values[0];
    var dateIdx = hdr.indexOf(t.dateCol);
    if (dateIdx < 0) return;

    var archiveName = t.sheet + ' Archive';
    var archiveSh = ss.getSheetByName(archiveName);
    if (!archiveSh) {
      archiveSh = ss.insertSheet(archiveName);
      archiveSh.appendRow(hdr);
      archiveSh.setFrozenRows(1);
    }

    // Partition in memory and write back in two batch calls — one row-by-row
    // appendRow+deleteRow per data row is what timed out at 6 minutes on a
    // sheet with ~1800 rows (each is a separate round trip). Batching drops
    // that to a handful of calls regardless of row count.
    var toArchive = [];
    var toKeep    = [];
    for (var i = 1; i < values.length; i++) {
      var raw = values[i][dateIdx];
      var d = raw instanceof Date ? raw : new Date(raw);
      if (raw && !isNaN(d.getTime()) && d < cutoff) toArchive.push(values[i]);
      else toKeep.push(values[i]);
    }
    if (toArchive.length > 0) {
      var archiveStart = archiveSh.getLastRow() + 1;
      archiveSh.getRange(archiveStart, 1, toArchive.length, hdr.length).setValues(toArchive);
      // Rewrite the source sheet's data rows with just the keepers, then
      // clear whatever trailing rows are now unused.
      var lastRow = sh.getLastRow();
      if (toKeep.length > 0) sh.getRange(2, 1, toKeep.length, hdr.length).setValues(toKeep);
      var staleFrom = 2 + toKeep.length;
      if (staleFrom <= lastRow) sh.getRange(staleFrom, 1, lastRow - staleFrom + 1, hdr.length).clearContent();
      summary.push(t.sheet + ': ' + toArchive.length + ' row' + (toArchive.length === 1 ? '' : 's') + ' archived');
    }
  });
  var msg = summary.length ? summary.join('\n') : 'Nothing to archive — no rows found before ' + ARCHIVE_CUTOFF_DATE_ + '.';
  Logger.log('Archived: ' + msg);
  SpreadsheetApp.getUi().alert('Archived pre-' + ARCHIVE_CUTOFF_DATE_ + ' test data:\n\n' + msg);
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

// Sheets that are never the registration store, even though some of them
// (Event RSVPs, Lesson Requests, Members) also happen to have a 'First Name'
// column — the header-sniffing fallback below must skip these or it can grab
// the wrong sheet. This was a live bug: whichever of these sheets sorts
// earliest in tab order was silently absorbing every new event registration,
// while ?action=counts / ?action=all read from it too — both returning empty
// because that sheet only ever had its header row, so real signups vanished
// into it invisibly instead of reaching the real "Registrations" sheet.
var NON_REG_SHEETS_ = ['Tee Sheets', 'Dining Reservations', 'Dashboard', 'Event RSVPs',
  'Lesson Requests', 'Ops Data', 'Site Content', 'Menus', 'Conditions',
  'Contact Inquiries', 'App Users', 'Settings', 'Members', 'Specials', 'League Regs'];

function getRegSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // The real registration store is always named exactly this — check it
  // directly instead of trusting tab order + header-guessing.
  var named = ss.getSheetByName('Registrations');
  if (named) return named;
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    if (NON_REG_SHEETS_.indexOf(name) !== -1) continue;
    if (sheets[i].getLastRow() < 1) continue;
    var headers = sheets[i].getRange(1, 1, 1, Math.max(1, sheets[i].getLastColumn())).getValues()[0];
    for (var j = 0; j < headers.length; j++) {
      if (headers[j] === 'Event' || headers[j] === 'First Name') return sheets[i];
    }
  }
  for (var i = 0; i < sheets.length; i++) {
    if (NON_REG_SHEETS_.indexOf(sheets[i].getName()) === -1) return sheets[i];
  }
  return ss.getActiveSheet();
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

function getOrCreateDiningSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Dining Reservations');
  var HEADERS = ['ID','Date','Time','Time Display','First Name','Last Name',
                 'Email','Phone','Party Size','Member','Venue','Notes','Status','Source','Submitted'];
  if (!sheet) {
    sheet = ss.insertSheet('Dining Reservations');
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    return sheet;
  }
  var existing = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  HEADERS.forEach(function(h) {
    if (existing.indexOf(h) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h);
      existing.push(h);
    }
  });
  return sheet;
}

function diningDateStr_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v || '').slice(0, 10);
}

function venueDisplay_(v) {
  var key = String(v || '').toLowerCase();
  if (key === 'grille' || key === 'grill') return 'Westwood Grill';
  if (key === 'hoovers') return "Hoover's Bar & Grille";
  return v ? String(v) : 'Dining Room';
}

// Fires when staff move a reservation to Confirmed — the initial request
// only ever told the guest "pending confirmation, we'll follow up," so
// this is the actual confirmation the guest is waiting on.
function sendDiningConfirmedEmail_(hdr, row) {
  function col(name) { var i = hdr.indexOf(name); return i >= 0 ? row[i] : ''; }
  var email = col('Email');
  if (!email) return;
  var first    = col('First Name') || 'Guest';
  var venueStr = venueDisplay_(col('Venue'));
  var dateStr  = diningDateStr_(col('Date'));
  var timeStr  = col('Time Display') || col('Time') || '';
  var partyNum = String(col('Party Size') || 1);
  MailApp.sendEmail({
    to: email,
    subject: 'Your ' + venueStr + ' reservation is confirmed — Westwood Hills Country Club',
    htmlBody:
      '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#222;">' +
      '<div style="background:#1a2b1f;padding:24px 32px;">' +
        '<p style="font-family:\'Cormorant Garamond\',Georgia,serif;font-size:22px;color:#b8976a;margin:0;">Westwood Hills Country Club</p>' +
        '<p style="color:rgba(245,240,232,.6);font-size:12px;margin:4px 0 0;">Poplar Bluff, Missouri</p>' +
      '</div>' +
      '<div style="padding:28px 32px;background:#fff;">' +
        '<p>Dear ' + escapeHtml_(first) + ',</p>' +
        '<p>Your reservation is <strong>confirmed</strong>. Here\'s a summary:</p>' +
        '<table style="border-collapse:collapse;width:100%;margin:16px 0;">' +
          '<tr><td style="padding:9px 12px;background:#f5f0e8;font-weight:600;width:38%;border-bottom:1px solid #e8e0d4;">Venue</td><td style="padding:9px 12px;border-bottom:1px solid #e8e0d4;">' + escapeHtml_(venueStr) + '</td></tr>' +
          '<tr><td style="padding:9px 12px;background:#f5f0e8;font-weight:600;border-bottom:1px solid #e8e0d4;">Date</td><td style="padding:9px 12px;border-bottom:1px solid #e8e0d4;">' + escapeHtml_(dateStr) + '</td></tr>' +
          '<tr><td style="padding:9px 12px;background:#f5f0e8;font-weight:600;border-bottom:1px solid #e8e0d4;">Time</td><td style="padding:9px 12px;border-bottom:1px solid #e8e0d4;">' + escapeHtml_(timeStr) + '</td></tr>' +
          '<tr><td style="padding:9px 12px;background:#f5f0e8;font-weight:600;">Party Size</td><td style="padding:9px 12px;">' + partyNum + ' ' + (partyNum === '1' ? 'guest' : 'guests') + '</td></tr>' +
        '</table>' +
        '<p style="font-size:13px;color:#666;">Need to make a change? Call us at <a href="tel:+15737855253">(573) 785-5253</a>.</p>' +
        '<p style="margin-top:28px;">We look forward to seeing you,<br><strong>Westwood Hills Country Club</strong><br>Poplar Bluff, Missouri</p>' +
      '</div>' +
      '</div>'
  });
}

function diningNormStatus_(s) {
  if (!s) return 'Pending';
  var t = String(s).trim();
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// Google Sheets treats a cell value starting with =, +, -, or @ as a formula.
// Prefix such values with an apostrophe so they land as inert text instead of
// executing when a staff member opens the sheet (spreadsheet/formula injection).
function sanitizeCell_(v) {
  if (v === null || v === undefined) return v;
  var s = String(v);
  if (/^[=+\-@]/.test(s)) return "'" + s;
  return v;
}

function sanitizeRow_(arr) {
  return arr.map(sanitizeCell_);
}

// Escape user-supplied text before it's interpolated into an email htmlBody,
// so a visitor can't inject arbitrary HTML/links into mail sent from the
// club's account (e.g. into the auto-reply sent back to their own address).
function escapeHtml_(v) {
  return String(v === null || v === undefined ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Server-side gate for staff-only mutating actions. The frontend's PIN check
// (validate-staff-pin) only gates the UI — without this, anyone could call a
// staff action directly (e.g. from the browser console) with no credentials
// at all. Callers must send the staff PIN as data.staffPin.
//
// The mobile app authenticates per-person (App Users email+PIN) rather than
// via the single shared portal PIN, so it never has data.staffPin to send.
// As a second path, accept a valid staff/both-role App User's own email +
// PIN (data.staffEmail / data.staffUserPin) as equivalent proof of authority.
function requireStaffAuth_(data) {
  var stored = opsGet_('staff_pin');
  if (stored !== null && stored !== '' && String(data.staffPin || '') === String(stored)) return true;

  var email = String(data.staffEmail || '').toLowerCase().trim();
  var pin   = String(data.staffUserPin || '').trim();
  if (!email || !pin) return false;
  var authSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('App Users');
  if (!authSheet) return false;
  var rows = authSheet.getDataRange().getValues();
  var hdrs = rows[0];
  var emailCol = hdrs.indexOf('Email'), pinCol = hdrs.indexOf('PIN'), roleCol = hdrs.indexOf('Role');
  if (emailCol < 0 || pinCol < 0 || roleCol < 0) return false;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][emailCol]).toLowerCase().trim() === email && String(rows[i][pinCol]).trim() === pin) {
      var role = String(rows[i][roleCol] || '').toLowerCase();
      return role === 'staff' || role === 'both';
    }
  }
  return false;
}

// Confirms a Drive file lives inside the WHCC Photos folder tree (root or
// one category folder below it) before an action is allowed to touch it.
function isWhccPhotoFile_(file) {
  var parents = file.getParents();
  while (parents.hasNext()) {
    var parent = parents.next();
    if (parent.getName() === 'WHCC Photos') return true;
    var grandparents = parent.getParents();
    while (grandparents.hasNext()) {
      if (grandparents.next().getName() === 'WHCC Photos') return true;
    }
  }
  return false;
}

// Rate limiting for PIN guesses. Apps Script web apps don't expose the
// caller's IP, so this is a global (not per-caller) lockout — after
// PIN_MAX_FAILURES wrong guesses within the window, ALL callers are locked
// out until it expires. That's a real tradeoff (one attacker can lock out
// legitimate staff), but it still turns brute-forcing a 4-digit PIN from
// "10,000 instant requests" into "10 requests per 15 minutes" — a ~250x
// slowdown — which is the actual goal here.
var PIN_MAX_FAILURES = 10;
var PIN_LOCKOUT_SECONDS = 900; // 15 minutes

function pinRateLimited_(key) {
  var count = parseInt(CacheService.getScriptCache().get(key) || '0', 10);
  return count >= PIN_MAX_FAILURES;
}
function recordPinFailure_(key) {
  var cache = CacheService.getScriptCache();
  var count = parseInt(cache.get(key) || '0', 10);
  cache.put(key, String(count + 1), PIN_LOCKOUT_SECONDS);
}
function clearPinFailures_(key) {
  CacheService.getScriptCache().remove(key);
}

// ── GET ───────────────────────────────────────────────────────────────────────

function doGet(e) {
  var action = e.parameter.action || '';

  if (action === 'counts') {
    var rows = getRegSheet().getDataRange().getValues();
    var counts = {};
    for (var i = 1; i < rows.length; i++) {
      var ev = String(rows[i][1] || '').trim();
      if (ev) counts[ev] = (counts[ev] || 0) + 1;
    }
    return jsonResponse(counts);
  }

  if (action === 'all') {
    var sh   = getRegSheet();
    var vals = sh.getDataRange().getValues();
    if (vals.length <= 1) return jsonResponse([]);
    var hdrs   = vals[0];
    var result = [];
    for (var i = 1; i < vals.length; i++) {
      var obj = {};
      for (var j = 0; j < hdrs.length; j++) {
        obj[hdrs[j]] = String(vals[i][j] === null || vals[i][j] === undefined ? '' : vals[i][j]);
      }
      result.push(obj);
    }
    return jsonResponse(result);
  }

  if (action === 'validate-board-pin') {
    if (pinRateLimited_('boardpin_fail')) return jsonResponse({ ok: false, error: 'Too many attempts. Try again later.', locked: true });
    var code = e.parameter.code || '';
    if (!code) return jsonResponse({ ok: false, error: 'No code provided' });
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sh = ss.getSheetByName('Settings');
      if (!sh) return jsonResponse({ ok: false, error: 'Settings sheet not found' });
      var storedCode = sh.getRange('B1').getValue().toString().trim();
      if (storedCode && code === storedCode) {
        clearPinFailures_('boardpin_fail');
        return jsonResponse({ ok: true });
      } else {
        recordPinFailure_('boardpin_fail');
        return jsonResponse({ ok: false, error: 'Invalid recovery code' });
      }
    } catch(err) {
      return jsonResponse({ ok: false, error: err.toString() });
    }
  }

  if (action === 'get-photos') {
    var cat = e.parameter.category || '';
    try {
      var folders = DriveApp.getFoldersByName('WHCC Photos');
      if (!folders.hasNext()) return jsonResponse([]);
      var root   = folders.next();
      var photos = [];
      if (cat) {
        var subs = root.getFoldersByName(cat);
        if (subs.hasNext()) {
          var files = subs.next().getFiles();
          while (files.hasNext()) {
            var f = files.next();
            photos.push({ id: f.getId(), name: f.getName(), category: cat,
              url: 'https://drive.google.com/uc?export=view&id=' + f.getId() });
          }
        }
      } else {
        var subs = root.getFolders();
        while (subs.hasNext()) {
          var sub = subs.next();
          var subCat = sub.getName();
          var files = sub.getFiles();
          while (files.hasNext()) {
            var f = files.next();
            photos.push({ id: f.getId(), name: f.getName(), category: subCat,
              url: 'https://drive.google.com/uc?export=view&id=' + f.getId() });
          }
        }
      }
      return jsonResponse(photos);
    } catch(err) {
      return jsonResponse([]);
    }
  }

  if (action === 'get-teesheets') {
    if (!requireStaffAuth_(e.parameter)) return jsonResponse({ error: 'Not authorized.' });
    var sh   = getTeeSheet();
    var vals = sh.getDataRange().getValues();
    if (vals.length <= 1) return jsonResponse([]);
    var eventFilter = e.parameter.event || '';
    var result = [];
    for (var i = 1; i < vals.length; i++) {
      if (eventFilter && String(vals[i][0]) !== eventFilter) continue;
      result.push({
        event:   String(vals[i][0]),
        round:   String(vals[i][1]),
        date:    String(vals[i][2]),
        config:  vals[i][3] ? JSON.parse(vals[i][3]) : {},
        groups:  vals[i][4] ? JSON.parse(vals[i][4]) : [],
        savedAt: String(vals[i][5])
      });
    }
    return jsonResponse(result);
  }

  if (action === 'get-dining') {
    if (!requireStaffAuth_(e.parameter)) return jsonResponse({ error: 'Not authorized.' });
    var dSheet = getOrCreateDiningSheet();
    if (dSheet.getLastRow() <= 1) return jsonResponse([]);
    var vals = dSheet.getDataRange().getValues();
    var hdrs = vals[0];
    var tz   = Session.getScriptTimeZone();
    var result = [];
    for (var i = 1; i < vals.length; i++) {
      var obj = {};
      for (var j = 0; j < hdrs.length; j++) {
        var v = vals[i][j];
        var h = hdrs[j];
        if (v instanceof Date) {
          obj[h] = (h === 'Time' || h === 'Time Display')
            ? Utilities.formatDate(v, tz, 'h:mm a')
            : Utilities.formatDate(v, tz, 'yyyy-MM-dd');
        } else {
          obj[h] = String(v === null || v === undefined ? '' : v);
        }
      }
      result.push(obj);
    }
    return jsonResponse(result);
  }

  if (action === 'get-specials') {
    var gsSheet = getOrCreateSpecialsSheet_();
    return jsonResponse({
      weeklySpecial: getSpecialsValue_(gsSheet, 'weeklySpecial'),
      fridayNight:   getSpecialsValue_(gsSheet, 'fridayNight')
    });
  }

  if (action === 'get-conditions') {
    var cSh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Conditions');
    if (!cSh || cSh.getLastRow() < 2) return jsonResponse({});
    return ContentService.createTextOutput(String(cSh.getRange(2, 1).getValue())).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'get-menus') {
    var mSh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Menus');
    if (!mSh || mSh.getLastRow() < 2) return jsonResponse({});
    return ContentService.createTextOutput(String(mSh.getRange(2, 1).getValue())).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'get-site-content') {
    var scSh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Site Content');
    if (!scSh || scSh.getLastRow() < 2) return jsonResponse({});
    return ContentService.createTextOutput(String(scSh.getRange(2, 1).getValue())).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'get-lessons') {
    if (!requireStaffAuth_(e.parameter)) return jsonResponse({ error: 'Not authorized.' });
    var lSh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Lesson Requests');
    if (!lSh || lSh.getLastRow() <= 1) return jsonResponse([]);
    var vals = lSh.getDataRange().getValues();
    var hdrs = vals[0];
    var result = [];
    for (var i = 1; i < vals.length; i++) {
      var obj = {};
      for (var j = 0; j < hdrs.length; j++) {
        var v = vals[i][j];
        obj[hdrs[j]] = (v instanceof Date) ? v.toISOString() : String(v === null || v === undefined ? '' : v);
      }
      result.push(obj);
    }
    return jsonResponse(result);
  }

  if (action === 'validate-login') {
    var loginEmail = (e.parameter.email || '').toLowerCase().trim();
    var loginPin   = (e.parameter.pin   || '').trim();
    if (!loginEmail || !loginPin) return jsonResponse({ ok: false, error: 'missing fields' });
    // Rate-limit per email (not globally) so brute-forcing one member's PIN
    // doesn't also lock every other member out of logging in.
    var loginRlKey = 'login_fail_' + loginEmail;
    if (pinRateLimited_(loginRlKey)) return jsonResponse({ ok: false, error: 'Too many attempts. Try again later.', locked: true });
    var authSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('App Users');
    if (!authSheet) {
      authSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('App Users');
      authSheet.appendRow(['Email','PIN','Role','Name','Title','Member Number','Membership','Handicap']);
      authSheet.setFrozenRows(1);
      return jsonResponse({ ok: false, error: 'no users configured' });
    }
    var authRows = authSheet.getDataRange().getValues();
    var authHdr  = authRows[0];
    var aEmail  = authHdr.indexOf('Email');
    var aPin    = authHdr.indexOf('PIN');
    var aRole   = authHdr.indexOf('Role');
    var aName   = authHdr.indexOf('Name');
    var aTitle  = authHdr.indexOf('Title');
    var aMemNum = authHdr.indexOf('Member Number');
    var aMem    = authHdr.indexOf('Membership');
    var aHcp    = authHdr.indexOf('Handicap');
    for (var ai = 1; ai < authRows.length; ai++) {
      var row = authRows[ai];
      if (String(row[aEmail]).toLowerCase().trim() === loginEmail && String(row[aPin]).trim() === loginPin) {
        clearPinFailures_(loginRlKey);
        var role = String(row[aRole] || 'member').toLowerCase();
        var acct = { role: role, name: String(row[aName] || '') };
        if (role === 'staff') {
          acct.title = String(row[aTitle] || 'Staff');
        } else {
          acct.memberNumber = String(row[aMemNum] || '');
          acct.membership   = String(row[aMem]    || '');
          acct.handicap     = String(row[aHcp]    || '');
        }
        return jsonResponse({ ok: true, account: acct });
      }
    }
    recordPinFailure_(loginRlKey);
    return jsonResponse({ ok: false, error: 'invalid credentials' });
  }

  if (action === 'verify-member') {
    var memberNum = (e.parameter.memberNum || '').trim();
    var last      = (e.parameter.last      || '').trim().toLowerCase();
    if (!memberNum || !last) return jsonResponse({ ok: false, error: 'Missing fields.' });
    var mSh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Members');
    if (!mSh) return jsonResponse({ ok: false, error: 'Members list not configured. Contact the Pro Shop.' });
    var rows  = mSh.getDataRange().getValues();
    var hdr   = rows[0];
    var cNum  = hdr.indexOf('Member Number');
    var cFirst = hdr.indexOf('First Name');
    var cLast = hdr.indexOf('Last Name');
    var cMem  = hdr.indexOf('Membership');
    var cHcp  = hdr.indexOf('Handicap');
    var inputNum = normMemberNum_(memberNum);
    for (var i = 1; i < rows.length; i++) {
      var rowNum  = normMemberNum_(rows[i][cNum]);
      var rowLast = String(rows[i][cLast] || '').trim().toLowerCase();
      if (rowNum === inputNum && rowLast === last) {
        var firstName = String(rows[i][cFirst] || '').trim();
        var lastName  = String(rows[i][cLast]  || '').trim();
        return jsonResponse({
          ok:         true,
          name:       (firstName + ' ' + lastName).trim(),
          membership: String(rows[i][cMem] || ''),
          handicap:   String(rows[i][cHcp] || '')
        });
      }
    }
    return jsonResponse({ ok: false, error: 'Member not found. Check your member number or contact the Pro Shop.' });
  }

  if (action === 'get-ops-data') {
    // Generic key/value read over the same store as get-waitlist/get-guest-notes/
    // get-pairings/get-live-scoring/get-all-ops — without auth here, those
    // endpoints' checks are trivially bypassed via ?action=get-ops-data&key=waitlist.
    if (!requireStaffAuth_(e.parameter)) return jsonResponse({ error: 'Not authorized.' });
    var key = e.parameter.key || '';
    if (!key) return jsonResponse({ error: 'missing key' });
    if (key === 'staff_pin') return jsonResponse({ error: 'forbidden' });
    var val = opsGet_(key);
    return jsonResponse(val !== null ? val : []);
  }

  // These four return internal staff-only operational data (waitlists, guest
  // notes, pairing rosters, live-scoring config) — gated below. Note a GET
  // query param is a weaker proof than the POST-body pattern used elsewhere
  // (it can land in server/proxy logs), but the actual site now calls the
  // POST equivalents of these four (see doPost) instead of these GET routes;
  // these are kept only for backward compatibility with any older caller.
  if (action === 'get-waitlist') {
    if (!requireStaffAuth_(e.parameter)) return jsonResponse({ error: 'Not authorized.' });
    var val = opsGet_('waitlist');
    return jsonResponse(val !== null ? val : []);
  }

  if (action === 'get-guest-notes') {
    if (!requireStaffAuth_(e.parameter)) return jsonResponse({ error: 'Not authorized.' });
    var val = opsGet_('guest_notes');
    return jsonResponse(val !== null ? val : []);
  }

  if (action === 'get-pairings') {
    if (!requireStaffAuth_(e.parameter)) return jsonResponse({ error: 'Not authorized.' });
    var val = opsGet_('pairings');
    return jsonResponse(val !== null ? val : {});
  }

  if (action === 'get-event-rsvps') {
    if (!requireStaffAuth_(e.parameter)) return jsonResponse({ error: 'Not authorized.' });
    var gerSh = getOrCreateEventRsvpSheet_();
    var gerVals = gerSh.getDataRange().getValues();
    if (gerVals.length <= 1) return jsonResponse([]);
    var gerHdrs = gerVals[0];
    var gerResult = [];
    for (var geri = 1; geri < gerVals.length; geri++) {
      var gerObj = {};
      for (var gerj = 0; gerj < gerHdrs.length; gerj++) {
        var gerV = gerVals[geri][gerj];
        gerObj[gerHdrs[gerj]] = (gerV instanceof Date) ? gerV.toISOString() : String(gerV === null || gerV === undefined ? '' : gerV);
      }
      gerResult.push(gerObj);
    }
    return jsonResponse(gerResult);
  }

  if (action === 'get-all-ops') {
    if (!requireStaffAuth_(e.parameter)) return jsonResponse({ error: 'Not authorized.' });
    var sh = getOpsSheet_();
    var rows = sh.getDataRange().getValues();
    var result = {};
    for (var i = 1; i < rows.length; i++) {
      try { result[String(rows[i][0])] = JSON.parse(rows[i][1]); } catch(e) {}
    }
    delete result['staff_pin'];
    return jsonResponse(result);
  }

  if (action === 'get-live-scoring') {
    if (!requireStaffAuth_(e.parameter)) return jsonResponse({ error: 'Not authorized.' });
    var val = opsGet_('live_scoring');
    return jsonResponse(val !== null ? val : {});
  }

  // The PIN itself is never returned — clients send a candidate and get ok/fail.
  if (action === 'validate-staff-pin') {
    if (pinRateLimited_('staffpin_fail')) return jsonResponse({ ok: false, error: 'Too many attempts. Try again later.', locked: true });
    var candidate = String(e.parameter.pin || '').trim();
    var storedPin = opsGet_('staff_pin');
    if (storedPin === null || storedPin === '') return jsonResponse({ ok: false, set: false });
    var pinMatch = candidate !== '' && candidate === String(storedPin);
    if (pinMatch) clearPinFailures_('staffpin_fail'); else recordPinFailure_('staffpin_fail');
    return jsonResponse({ ok: pinMatch, set: true });
  }

  if (action === 'get-regs') {
    // Mobile app variant of 'all' — includes the column aliases the app reads
    var grSh   = getRegSheet();
    var grVals = grSh.getDataRange().getValues();
    if (grVals.length <= 1) return jsonResponse([]);
    var grHdrs = grVals[0];
    var grOut  = [];
    for (var gri = 1; gri < grVals.length; gri++) {
      var grObj = {};
      for (var grj = 0; grj < grHdrs.length; grj++) {
        grObj[grHdrs[grj]] = String(grVals[gri][grj] === null || grVals[gri][grj] === undefined ? '' : grVals[gri][grj]);
      }
      if (!grObj['First Name'] && !grObj['Last Name']) continue;
      if (grObj['Partner/Team'] === undefined) grObj['Partner/Team'] = grObj['Partner'] || '';
      if (grObj['GHIN'] === undefined) grObj['GHIN'] = grObj['GHIN Handicap'] || '';
      grOut.push(grObj);
    }
    return jsonResponse(grOut);
  }

  if (action === 'get-members') {
    // Mobile member directory — display-shaped objects, PINs never included
    var gmSh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Members');
    if (!gmSh || gmSh.getLastRow() < 2) return jsonResponse([]);
    var gmVals = gmSh.getDataRange().getValues();
    var gmHdr  = gmVals[0];
    var gmNum  = gmHdr.indexOf('Member Number');
    var gmFn   = gmHdr.indexOf('First Name');
    var gmLn   = gmHdr.indexOf('Last Name');
    var gmEm   = gmHdr.indexOf('Email');
    var gmMem  = gmHdr.indexOf('Membership');
    var gmHcp  = gmHdr.indexOf('Handicap');
    var gmPh   = gmHdr.indexOf('Phone');
    var gmOut  = [];
    for (var gmi = 1; gmi < gmVals.length; gmi++) {
      var gmName = ((gmFn >= 0 ? String(gmVals[gmi][gmFn] || '') : '') + ' ' +
                    (gmLn >= 0 ? String(gmVals[gmi][gmLn] || '') : '')).trim();
      var gmN = gmNum >= 0 ? String(gmVals[gmi][gmNum] || '') : '';
      var gmE = gmEm  >= 0 ? String(gmVals[gmi][gmEm]  || '') : '';
      if (!gmName && !gmN && !gmE) continue;
      gmOut.push({
        name:       gmName,
        number:     gmN,
        email:      gmE,
        phone:      gmPh  >= 0 ? String(gmVals[gmi][gmPh]  || '') : '',
        membership: gmMem >= 0 ? String(gmVals[gmi][gmMem] || '') : '',
        handicap:   gmHcp >= 0 ? String(gmVals[gmi][gmHcp] || '') : ''
      });
    }
    return jsonResponse(gmOut);
  }

  if (action === 'cancel-dining') {
    var cancelId = e.parameter.id || '';
    var htmlMsg  = 'No reservation ID was provided.';
    if (cancelId) {
      var cdss = SpreadsheetApp.getActiveSpreadsheet();
      var cdSh = cdss.getSheetByName('Dining Reservations');
      if (cdSh) {
        var cdVals = cdSh.getDataRange().getValues();
        var cdHdrs = cdVals[0];
        var cdIdC  = cdHdrs.indexOf('ID');
        var cdStC  = cdHdrs.indexOf('Status');
        var cdFound = false;
        for (var cdi = 1; cdi < cdVals.length; cdi++) {
          if (String(cdVals[cdi][cdIdC]) === cancelId) {
            cdFound = true;
            if (String(cdVals[cdi][cdStC]) === 'Cancelled') {
              htmlMsg = 'This reservation has already been cancelled.';
            } else {
              cdSh.getRange(cdi + 1, cdStC + 1).setValue('Cancelled');
              htmlMsg = 'Your reservation has been cancelled. We hope to see you soon.';
            }
            break;
          }
        }
        if (!cdFound) htmlMsg = 'Reservation not found. It may have already been removed.';
      }
    }
    // ContentService has no HTML mime type — HtmlService is required to render a page
    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Westwood Hills Country Club</title></head>' +
      '<body style="font-family:Georgia,serif;text-align:center;padding:60px 20px;max-width:480px;margin:0 auto;color:#222;">' +
      '<div style="background:#1a2b1f;padding:20px 32px;margin-bottom:32px;">' +
        '<p style="font-size:20px;color:#b8976a;margin:0;">Westwood Hills Country Club</p>' +
        '<p style="color:rgba(245,240,232,.6);font-size:12px;margin:4px 0 0;">Poplar Bluff, Missouri</p>' +
      '</div>' +
      '<p style="font-size:18px;margin-bottom:16px;">' + htmlMsg + '</p>' +
      '<p style="color:#666;font-size:14px;">For assistance, call <a href="tel:+15737855253" style="color:#1a2b1f;">(573) 785-5253</a>.</p>' +
      '</body></html>'
    );
  }

  return jsonResponse({ error: 'unknown action' });
}

// ── POST ──────────────────────────────────────────────────────────────────────

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss   = SpreadsheetApp.getActiveSpreadsheet();

  if (data.action === 'addContact') {
    var sh = ss.getSheetByName('Contact Inquiries');
    if (!sh) {
      sh = ss.insertSheet('Contact Inquiries');
      sh.appendRow(['Timestamp','Name','Email','Phone','Subject','Message','Status']);
      sh.setFrozenRows(1);
    }
    sh.appendRow(sanitizeRow_([data.submitted || data.timestamp || new Date().toISOString(), data.name, data.email, data.phone, data.subject, data.message, 'New']));
    var isMembershipInquiry = data.subject && data.subject.toLowerCase().indexOf('membership') >= 0;
    try {
      if (data.email) {
        if (isMembershipInquiry) {
          MailApp.sendEmail({
            to: data.email,
            subject: 'Thank you for your interest — Westwood Hills Country Club',
            htmlBody:
              '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#222;">' +
              '<div style="background:#1a2b1f;padding:24px 32px;">' +
                '<p style="font-family:\'Cormorant Garamond\',Georgia,serif;font-size:22px;color:#b8976a;margin:0;">Westwood Hills Country Club</p>' +
                '<p style="color:rgba(245,240,232,.6);font-size:12px;margin:4px 0 0;">Poplar Bluff, Missouri</p>' +
              '</div>' +
              '<div style="padding:28px 32px;background:#fff;">' +
                '<p>Dear ' + escapeHtml_(data.name) + ',</p>' +
                '<p>Thank you for your interest in Westwood Hills Country Club membership. We\'re delighted you\'re considering joining our community.</p>' +
                '<p>A member of our staff will be in touch shortly to answer your questions. If you\'d like, we\'d love to schedule a personal tour and a complimentary round of golf — no obligation required.</p>' +
                '<p>Here\'s a quick look at what membership includes:</p>' +
                '<ul style="padding-left:20px;line-height:1.9;">' +
                  '<li>Unlimited golf on our championship course, seven days a week</li>' +
                  '<li>Full aquatics complex for the whole family all summer</li>' +
                  '<li>Exclusive dining at Hoover\'s Restaurant and the Westwood Grill</li>' +
                  '<li>Access to all club events, leagues, and tournaments</li>' +
                  '<li>A close-knit community of about 200 member families</li>' +
                '</ul>' +
                '<p style="font-size:13px;color:#666;margin-top:20px;">If you have immediate questions, call us at <a href="tel:+15737855253">(573) 785-5253</a>.</p>' +
                '<p style="margin-top:28px;">Warm regards,<br><strong>Westwood Hills Country Club</strong><br>Poplar Bluff, Missouri</p>' +
              '</div>' +
              '</div>'
          });
        } else {
          MailApp.sendEmail({
            to: data.email,
            subject: 'We received your message — Westwood Hills Country Club',
            htmlBody:
              '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#222;">' +
              '<div style="background:#1a2b1f;padding:24px 32px;">' +
                '<p style="font-family:\'Cormorant Garamond\',Georgia,serif;font-size:22px;color:#b8976a;margin:0;">Westwood Hills Country Club</p>' +
                '<p style="color:rgba(245,240,232,.6);font-size:12px;margin:4px 0 0;">Poplar Bluff, Missouri</p>' +
              '</div>' +
              '<div style="padding:28px 32px;background:#fff;">' +
                '<p>Dear ' + escapeHtml_(data.name) + ',</p>' +
                '<p>Thank you for reaching out to Westwood Hills Country Club. We have received your inquiry and a member of our team will be in touch soon.</p>' +
                '<p><strong>Your message:</strong><br><em>' + escapeHtml_(data.message) + '</em></p>' +
                '<p>In the meantime, feel free to call us at <a href="tel:+15737855253">(573) 785-5253</a> or visit us at the club.</p>' +
                '<p style="margin-top:28px;">Warm regards,<br><strong>Westwood Hills Country Club</strong><br>Poplar Bluff, Missouri</p>' +
              '</div>' +
              '</div>'
          });
        }
      }
      MailApp.sendEmail({
        to: 'sctr1217@gmail.com,mfiehtner@westwoodhillscountryclub.com',
        subject: 'New Contact Inquiry: ' + data.subject + ' - ' + data.name,
        body: 'New contact form submission:\n\n' +
          'Name: '    + data.name    + '\n' +
          'Email: '   + data.email   + '\n' +
          'Phone: '   + data.phone   + '\n' +
          'Subject: ' + data.subject + '\n' +
          'Message: ' + data.message + '\n\n' +
          'Submitted: ' + (data.submitted || data.timestamp || '')
      });
    } catch(mailErr) {
      Logger.log('MailApp error: ' + mailErr.toString());
    }
    return jsonResponse({ status: 'ok' });
  }

  // The PIN itself is never returned — clients send a candidate and get ok/fail.
  // POST body is used (rather than a GET query param) so the PIN doesn't end up in server/proxy access logs.
  if (data.action === 'validate-staff-pin') {
    if (pinRateLimited_('staffpin_fail')) return jsonResponse({ ok: false, error: 'Too many attempts. Try again later.', locked: true });
    var pinCandidate = String(data.pin || '').trim();
    var storedStaffPin = opsGet_('staff_pin');
    if (storedStaffPin === null || storedStaffPin === '') return jsonResponse({ ok: false, set: false });
    var pinCandidateMatch = pinCandidate !== '' && pinCandidate === String(storedStaffPin);
    if (pinCandidateMatch) clearPinFailures_('staffpin_fail'); else recordPinFailure_('staffpin_fail');
    return jsonResponse({ ok: pinCandidateMatch, set: true });
  }

  if (data.action === 'validate-board-pin') {
    if (pinRateLimited_('boardpin_fail')) return jsonResponse({ ok: false, error: 'Too many attempts. Try again later.', locked: true });
    var recoveryCode = data.code || '';
    if (!recoveryCode) return jsonResponse({ ok: false, error: 'No code provided' });
    try {
      var vbpSs = SpreadsheetApp.getActiveSpreadsheet();
      var vbpSh = vbpSs.getSheetByName('Settings');
      if (!vbpSh) return jsonResponse({ ok: false, error: 'Settings sheet not found' });
      var vbpStoredCode = vbpSh.getRange('B1').getValue().toString().trim();
      if (vbpStoredCode && recoveryCode === vbpStoredCode) {
        clearPinFailures_('boardpin_fail');
        return jsonResponse({ ok: true });
      } else {
        recordPinFailure_('boardpin_fail');
        return jsonResponse({ ok: false, error: 'Invalid recovery code' });
      }
    } catch(err) {
      return jsonResponse({ ok: false, error: err.toString() });
    }
  }

  if (data.action === 'upload-photo') {
    if (!requireStaffAuth_(data)) return jsonResponse({ ok: false, error: 'Not authorized.' });
    try {
      var folders = DriveApp.getFoldersByName('WHCC Photos');
      var root = folders.hasNext() ? folders.next() : DriveApp.createFolder('WHCC Photos');
      var category = data.category || 'General';
      var subs = root.getFoldersByName(category);
      var sub  = subs.hasNext() ? subs.next() : root.createFolder(category);
      var blob = Utilities.newBlob(
        Utilities.base64Decode(data.base64),
        data.mimeType || 'image/jpeg',
        data.filename || ('photo-' + new Date().getTime() + '.jpg')
      );
      var file = sub.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return jsonResponse({
        ok:  true,
        url: 'https://drive.google.com/uc?export=view&id=' + file.getId(),
        id:  file.getId()
      });
    } catch(err) {
      return jsonResponse({ ok: false, error: err.toString() });
    }
  }

  if (data.action === 'make-photos-public') {
    if (!requireStaffAuth_(data)) return jsonResponse({ ok: false, error: 'Not authorized.' });
    try {
      var mpFolders = DriveApp.getFoldersByName('WHCC Photos');
      if (!mpFolders.hasNext()) return jsonResponse({ ok: true, count: 0 });
      var mpRoot  = mpFolders.next();
      var mpCount = 0;
      function shareAll(folder) {
        var fs = folder.getFiles();
        while (fs.hasNext()) {
          fs.next().setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          mpCount++;
        }
      }
      shareAll(mpRoot);
      var mpSubs = mpRoot.getFolders();
      while (mpSubs.hasNext()) shareAll(mpSubs.next());
      return jsonResponse({ ok: true, count: mpCount });
    } catch(err) {
      return jsonResponse({ ok: false, error: err.toString() });
    }
  }

  if (data.action === 'delete-photo') {
    if (!requireStaffAuth_(data)) return jsonResponse({ ok: false, error: 'Not authorized.' });
    try {
      var dpFile = DriveApp.getFileById(data.fileId);
      // The script runs as the site owner's Drive account, so without this
      // check a staff-PIN holder could trash any file ID they can obtain —
      // not just club photos. Confirm the file actually lives under the
      // WHCC Photos folder tree before trashing it.
      if (!isWhccPhotoFile_(dpFile)) return jsonResponse({ ok: false, error: 'Not authorized.' });
      dpFile.setTrashed(true);
      return jsonResponse({ ok: true });
    } catch(err) {
      return jsonResponse({ ok: false, error: err.toString() });
    }
  }

  if (data.action === 'delete') {
    if (!requireStaffAuth_(data)) return jsonResponse({ status: 'not authorized' });
    var sh = getRegSheet();
    var rows = sh.getDataRange().getValues();
    // IDs here are client-generated Date.now().toString() values (numeric
    // strings) — Sheets auto-types a numeric-looking value as a Number when
    // read back, so a strict === against the string data.id never matched
    // and this always reported "deleted" whether or not a row actually was.
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(data.id)) {
        sh.deleteRow(i + 1);
        return jsonResponse({ status: 'deleted' });
      }
    }
    return jsonResponse({ status: 'not found' });
  }

  if (data.action === 'save-teesheet') {
    if (!requireStaffAuth_(data)) return jsonResponse({ status: 'not authorized' });
    var teeLock = LockService.getScriptLock();
    try { teeLock.waitLock(10000); } catch (teeLockErr) { return jsonResponse({ status: 'busy' }); }
    try {
      var sh = getTeeSheet();
      var rows = sh.getDataRange().getValues();
      var found = -1;
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] === data.event && String(rows[i][1]) === String(data.round)) { found = i + 1; break; }
      }
      var rowData = sanitizeRow_([data.event, data.round, data.date,
                     JSON.stringify(data.config || {}),
                     JSON.stringify(data.groups || []),
                     new Date().toISOString()]);
      if (found > 0) sh.getRange(found, 1, 1, 6).setValues([rowData]);
      else           sh.appendRow(rowData);
      return jsonResponse({ status: 'ok' });
    } finally { teeLock.releaseLock(); }
  }

  if (data.action === 'save-scores') {
    if (!requireStaffAuth_(data)) return jsonResponse({ status: 'not authorized' });
    var scoreLock = LockService.getScriptLock();
    try { scoreLock.waitLock(10000); } catch (scoreLockErr) { return jsonResponse({ status: 'busy' }); }
    try {
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
      return jsonResponse({ status: 'ok' });
    } finally { scoreLock.releaseLock(); }
  }

  if (data.action === 'lesson-request') {
    var lSheet = getOrCreateLessonSheet();
    var lHdrs = lSheet.getRange(1, 1, 1, lSheet.getLastColumn()).getValues()[0];
    var lRow = new Array(lHdrs.length).fill('');
    function setL(name, val) { var i = lHdrs.indexOf(name); if (i >= 0) lRow[i] = val || ''; }
    setL('ID',            data.id           || Utilities.getUuid());
    setL('First Name',    data.firstName    || '');
    setL('Last Name',     data.lastName     || '');
    setL('Email',         data.email        || '');
    setL('Phone',         data.phone        || '');
    setL('Lesson Type',   data.lessonType   || '');
    setL('Skill Level',   data.skillLevel   || '');
    setL('Preferred Days',data.preferredDays|| '');
    setL('Notes',         data.notes        || '');
    setL('Source',        data.source       || 'website');
    setL('Submitted',     data.timestamp    || new Date().toISOString());
    lSheet.appendRow(sanitizeRow_(lRow));
    return jsonResponse({ ok: true });
  }

  if (data.action === 'dining-reservation') {
    // The public calendar widget only prevents *clicking* an invalid date —
    // res-date-value is a plain field, so a direct POST (or a stale value
    // left over from switching venue/member type) can reach here with a
    // past date or a day the venue is closed. This is the real trust
    // boundary; validate for real instead of trusting the client.
    var resDateObj = data.date ? new Date(data.date + 'T00:00:00') : null;
    if (!resDateObj || isNaN(resDateObj.getTime())) {
      return jsonResponse({ ok: false, error: 'Invalid reservation date.' });
    }
    var todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);
    if (resDateObj < todayObj) {
      return jsonResponse({ ok: false, error: 'Reservation date is in the past.' });
    }
    // Staff need to book exceptions (private events, holiday hours) on days
    // that are otherwise closed — only the public-facing form is restricted
    // to the venue's normal open days.
    if (String(data.source || '') !== 'staff-portal') {
      var resVenue = String(data.venue || '').toLowerCase();
      var resDow = resDateObj.getDay();
      if ((resVenue === 'grille' || resVenue === 'grill') && resDow === 1) {
        return jsonResponse({ ok: false, error: 'The Westwood Grill is closed on Mondays.' });
      }
      if (resVenue === 'hoovers') {
        var isMemberRes = String(data.member || '') === 'member';
        var resDateNum = resDateObj.getDate();
        var validHooversDay = isMemberRes
          ? (resDow === 4 || resDow === 5 || resDow === 6)
          : (resDow === 6 && resDateNum >= 15 && resDateNum <= 21);
        if (!validHooversDay) {
          return jsonResponse({ ok: false, error: isMemberRes
            ? "Hoover's is only open Thursday-Saturday for members."
            : "Non-member reservations at Hoover's are only available on the 3rd Saturday of the month." });
        }
      }
    }
    var dSheet = getOrCreateDiningSheet();
    var hdrs = dSheet.getRange(1, 1, 1, dSheet.getLastColumn()).getValues()[0];
    var row = new Array(hdrs.length).fill('');
    function setCol(name, val) { var i = hdrs.indexOf(name); if (i >= 0) row[i] = val || ''; }
    // Always generate the ID server-side (never trust the client's) — this ID
    // is embedded in the unauthenticated cancel-dining link, and the frontend
    // was sending a predictable Date.now() timestamp, letting anyone brute-force
    // nearby IDs and cancel other members' reservations.
    setCol('ID',           Utilities.getUuid());
    setCol('Date',         data.date        || '');
    setCol('Time',         data.time24      || '');
    setCol('Time Display', data.timeDisplay || data.time24 || '');
    setCol('First Name',   data.firstName   || (data.name ? data.name.split(' ')[0] : ''));
    setCol('Last Name',    data.lastName    || (data.name ? data.name.split(' ').slice(1).join(' ') : ''));
    setCol('Email',        data.email       || '');
    setCol('Phone',        data.phone       || '');
    setCol('Party Size',   data.party       || 1);
    setCol('Member',       data.member      || '');
    setCol('Venue',        data.venue       || '');
    setCol('Notes',        data.note        || '');
    setCol('Status',       'Pending');
    setCol('Source',       data.source      || 'website');
    setCol('Submitted',    data.submitted   || new Date().toISOString());
    row = sanitizeRow_(row);
    dSheet.appendRow(row);
    try {
      var resId      = row[hdrs.indexOf('ID')];
      var guestEmail = data.email || '';
      var guestFirst = data.firstName || (data.name ? data.name.split(' ')[0] : '') || 'Guest';
      var scriptUrl  = ScriptApp.getService().getUrl();
      var cancelUrl  = scriptUrl + '?action=cancel-dining&id=' + encodeURIComponent(resId);
      var venueStr   = venueDisplay_(data.venue);
      var dateStr    = data.date  || '';
      var timeStr    = data.timeDisplay || data.time24 || '';
      var partyNum   = String(data.party || 1);
      if (guestEmail) {
        MailApp.sendEmail({
          to: guestEmail,
          subject: 'Your dining reservation — Westwood Hills Country Club',
          htmlBody:
            '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#222;">' +
            '<div style="background:#1a2b1f;padding:24px 32px;">' +
              '<p style="font-family:\'Cormorant Garamond\',Georgia,serif;font-size:22px;color:#b8976a;margin:0;">Westwood Hills Country Club</p>' +
              '<p style="color:rgba(245,240,232,.6);font-size:12px;margin:4px 0 0;">Poplar Bluff, Missouri</p>' +
            '</div>' +
            '<div style="padding:28px 32px;background:#fff;">' +
              '<p>Dear ' + escapeHtml_(guestFirst) + ',</p>' +
              '<p>Thank you — we\'ve received your reservation request for <strong>' + escapeHtml_(venueStr) + '</strong>. Here\'s a summary:</p>' +
              '<table style="border-collapse:collapse;width:100%;margin:16px 0;">' +
                '<tr><td style="padding:9px 12px;background:#f5f0e8;font-weight:600;width:38%;border-bottom:1px solid #e8e0d4;">Venue</td><td style="padding:9px 12px;border-bottom:1px solid #e8e0d4;">' + escapeHtml_(venueStr) + '</td></tr>' +
                '<tr><td style="padding:9px 12px;background:#f5f0e8;font-weight:600;border-bottom:1px solid #e8e0d4;">Date</td><td style="padding:9px 12px;border-bottom:1px solid #e8e0d4;">' + escapeHtml_(dateStr) + '</td></tr>' +
                '<tr><td style="padding:9px 12px;background:#f5f0e8;font-weight:600;border-bottom:1px solid #e8e0d4;">Time</td><td style="padding:9px 12px;border-bottom:1px solid #e8e0d4;">' + escapeHtml_(timeStr) + '</td></tr>' +
                '<tr><td style="padding:9px 12px;background:#f5f0e8;font-weight:600;">Party Size</td><td style="padding:9px 12px;">' + partyNum + ' ' + (partyNum === '1' ? 'guest' : 'guests') + '</td></tr>' +
              '</table>' +
              '<p style="font-size:13px;color:#666;">Your reservation is pending confirmation. We\'ll confirm by phone or email within 24 hours. For same-day reservations, please call <a href="tel:+15737855253">(573) 785-5253</a>.</p>' +
              '<p style="margin-top:20px;"><a href="' + cancelUrl + '" style="color:#999;font-size:12px;">Need to cancel? Click here.</a></p>' +
              '<p style="margin-top:28px;">We look forward to seeing you,<br><strong>Westwood Hills Country Club</strong><br>Poplar Bluff, Missouri</p>' +
            '</div>' +
            '</div>'
        });
      }
      MailApp.sendEmail({
        to: 'sctr1217@gmail.com,mfiehtner@westwoodhillscountryclub.com',
        subject: 'New Dining Reservation: ' + guestFirst + ' ' + (data.lastName || '') + ' — ' + dateStr + ' ' + timeStr,
        body: 'New dining reservation request:\n\n' +
          'Name: '   + guestFirst + ' ' + (data.lastName || '') + '\n' +
          'Email: '  + guestEmail             + '\n' +
          'Phone: '  + (data.phone || '')     + '\n' +
          'Venue: '  + venueStr               + '\n' +
          'Date: '   + dateStr                + '\n' +
          'Time: '   + timeStr                + '\n' +
          'Party: '  + partyNum               + '\n' +
          'Member: ' + (data.member || '')    + '\n' +
          'Notes: '  + (data.note   || '')    + '\n\n' +
          'Manage reservations in the staff portal.'
      });
    } catch(dMailErr) {
      Logger.log('Dining email error: ' + dMailErr.toString());
    }
    return jsonResponse({ ok: true });
  }

  if (data.action === 'update-dining') {
    if (!requireStaffAuth_(data)) return jsonResponse({ ok: false, error: 'Not authorized.' });
    var dSheet2 = getOrCreateDiningSheet();
    var dRows   = dSheet2.getDataRange().getValues();
    var dHdr    = dRows[0];
    var idCol   = dHdr.indexOf('ID');
    var statCol = dHdr.indexOf('Status');
    if (idCol < 0 || statCol < 0) return jsonResponse({ ok: false, error: 'columns missing' });
    for (var di = 1; di < dRows.length; di++) {
      if (String(dRows[di][idCol]) === String(data.id)) {
        var newStatus = diningNormStatus_(data.status);
        dSheet2.getRange(di + 1, statCol + 1).setValue(newStatus);
        // Only the confirmation step gets an email — the initial request
        // already emailed the guest ("pending confirmation"), and Cancel
        // is handled separately, so this is the one transition nobody
        // was telling the guest about.
        if (newStatus === 'Confirmed') {
          try { sendDiningConfirmedEmail_(dHdr, dRows[di]); }
          catch (dcMailErr) { Logger.log('Dining confirm email error: ' + dcMailErr.toString()); }
        }
        return jsonResponse({ ok: true });
      }
    }
    return jsonResponse({ ok: false, error: 'not found' });
  }

  if (data.action === 'event-rsvp') {
    var rsvpSh = getOrCreateEventRsvpSheet_();
    var rsvpId = Utilities.getUuid();
    rsvpSh.appendRow(sanitizeRow_([
      rsvpId,
      new Date().toISOString(),
      data.eventName  || '',
      data.eventDate  || '',
      data.firstName  || '',
      data.lastName   || '',
      data.email      || '',
      data.phone      || ''
    ]));
    try {
      var rEmail = data.email || '';
      var rFirst = data.firstName || 'Guest';
      var rEvt   = data.eventName || 'the event';
      var rDate  = data.eventDate || '';
      if (rEmail) {
        MailApp.sendEmail({
          to: rEmail,
          subject: 'You\'re attending ' + rEvt + ' — Westwood Hills Country Club',
          htmlBody:
            '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#222;">' +
            '<div style="background:#1a2b1f;padding:24px 32px;">' +
              '<p style="font-family:\'Cormorant Garamond\',Georgia,serif;font-size:22px;color:#b8976a;margin:0;">Westwood Hills Country Club</p>' +
              '<p style="color:rgba(245,240,232,.6);font-size:12px;margin:4px 0 0;">Poplar Bluff, Missouri</p>' +
            '</div>' +
            '<div style="padding:28px 32px;background:#fff;">' +
              '<p>Dear ' + escapeHtml_(rFirst) + ',</p>' +
              '<p>We\'ve noted your RSVP for <strong>' + escapeHtml_(rEvt) + '</strong>' + (rDate ? ' on <strong>' + escapeHtml_(rDate) + '</strong>' : '') + '. We look forward to seeing you there!</p>' +
              '<p style="font-size:13px;color:#666;">Questions? Call us at <a href="tel:+15737855253">(573) 785-5253</a> or stop by the club.</p>' +
              '<p style="margin-top:28px;">See you soon,<br><strong>Westwood Hills Country Club</strong><br>Poplar Bluff, Missouri</p>' +
            '</div>' +
            '</div>'
        });
      }
      MailApp.sendEmail({
        to: 'sctr1217@gmail.com',
        subject: 'New Event RSVP: ' + rFirst + ' ' + (data.lastName || '') + ' → ' + rEvt,
        body: 'New event RSVP:\n\nEvent: ' + rEvt + '\nDate: ' + rDate + '\n\nName: ' + rFirst + ' ' + (data.lastName || '') + '\nEmail: ' + rEmail + '\nPhone: ' + (data.phone || '')
      });
    } catch(rMailErr) {
      Logger.log('RSVP email error: ' + rMailErr.toString());
    }
    return jsonResponse({ ok: true });
  }

  if (data.action === 'save-specials') {
    if (!requireStaffAuth_(data)) return jsonResponse({ ok: false, error: 'Not authorized.' });
    var ssSheet = getOrCreateSpecialsSheet_();
    setSpecialsValue_(ssSheet, 'weeklySpecial', data.weeklySpecial || {});
    setSpecialsValue_(ssSheet, 'fridayNight',   data.fridayNight   || {});
    return jsonResponse({ ok: true });
  }

  if (data.action === 'save-conditions') {
    if (!requireStaffAuth_(data)) return jsonResponse({ ok: false, error: 'Not authorized.' });
    var condLock = LockService.getScriptLock();
    try { condLock.waitLock(10000); } catch (condLockErr) { return jsonResponse({ ok: false, error: 'busy' }); }
    try {
      var cSh = ss.getSheetByName('Conditions');
      if (!cSh) { cSh = ss.insertSheet('Conditions'); cSh.appendRow(['Data','Updated']); cSh.setFrozenRows(1); }
      var cJson = JSON.stringify(data.data || {});
      if (cSh.getLastRow() < 2) cSh.appendRow([cJson, new Date().toISOString()]);
      else cSh.getRange(2, 1, 1, 2).setValues([[cJson, new Date().toISOString()]]);
      return jsonResponse({ ok: true });
    } finally { condLock.releaseLock(); }
  }

  if (data.action === 'save-menus') {
    if (!requireStaffAuth_(data)) return jsonResponse({ ok: false, error: 'Not authorized.' });
    var menuLock = LockService.getScriptLock();
    try { menuLock.waitLock(10000); } catch (menuLockErr) { return jsonResponse({ ok: false, error: 'busy' }); }
    try {
      var mSh = ss.getSheetByName('Menus');
      if (!mSh) { mSh = ss.insertSheet('Menus'); mSh.appendRow(['Data','Updated']); mSh.setFrozenRows(1); }
      var mJson = JSON.stringify(data.data || {});
      if (mSh.getLastRow() < 2) mSh.appendRow([mJson, new Date().toISOString()]);
      else mSh.getRange(2, 1, 1, 2).setValues([[mJson, new Date().toISOString()]]);
      return jsonResponse({ ok: true });
    } finally { menuLock.releaseLock(); }
  }

  if (data.action === 'save-site-content') {
    if (!requireStaffAuth_(data)) return jsonResponse({ ok: false, error: 'Not authorized.' });
    var scLock = LockService.getScriptLock();
    try { scLock.waitLock(10000); } catch (scLockErr) { return jsonResponse({ ok: false, error: 'busy' }); }
    try {
      var scSh = ss.getSheetByName('Site Content');
      if (!scSh) { scSh = ss.insertSheet('Site Content'); scSh.appendRow(['Data','Updated']); scSh.setFrozenRows(1); }
      var scJson = JSON.stringify(data.data || {});
      if (scSh.getLastRow() < 2) scSh.appendRow([scJson, new Date().toISOString()]);
      else scSh.getRange(2, 1, 1, 2).setValues([[scJson, new Date().toISOString()]]);
      return jsonResponse({ ok: true });
    } finally { scLock.releaseLock(); }
  }

  if (data.action === 'create-pin') {
    var email     = (data.email     || '').toLowerCase().trim();
    var memberNum = (data.memberNum || '').trim();
    var lastName  = (data.lastName  || '').trim().toLowerCase();
    var pin       = (data.pin       || '').trim();
    if (!email || !memberNum || !lastName || !/^\d{4}$/.test(pin))
      return jsonResponse({ ok: false, error: 'Invalid request.' });
    var mSh = ss.getSheetByName('Members');
    if (!mSh) return jsonResponse({ ok: false, error: 'Members list not configured.' });
    var mRows  = mSh.getDataRange().getValues();
    var mHdr   = mRows[0];
    var cNum   = mHdr.indexOf('Member Number');
    var cFirst = mHdr.indexOf('First Name');
    var cLast  = mHdr.indexOf('Last Name');
    var cMem   = mHdr.indexOf('Membership');
    var cHcp   = mHdr.indexOf('Handicap');
    var inputNum  = normMemberNum_(memberNum);
    var memberRow = null;
    var storedNum = '';
    for (var i = 1; i < mRows.length; i++) {
      // Require both member number AND last name to match — member numbers are
      // predictable/sequential, so number alone isn't proof of identity.
      if (normMemberNum_(mRows[i][cNum]) === inputNum && String(mRows[i][cLast] || '').trim().toLowerCase() === lastName) {
        memberRow = mRows[i];
        storedNum = String(mRows[i][cNum] || '').trim();
        break;
      }
    }
    if (!memberRow) return jsonResponse({ ok: false, error: 'Member not found. Check your member number and last name.' });
    var auSh = ss.getSheetByName('App Users');
    if (!auSh) {
      auSh = ss.insertSheet('App Users');
      auSh.appendRow(['Email','PIN','Role','Name','Title','Member Number','Membership','Handicap']);
      auSh.setFrozenRows(1);
    }
    var auRows = auSh.getDataRange().getValues();
    var auHdr  = auRows[0];
    var auEmail = auHdr.indexOf('Email');
    var auNum   = auHdr.indexOf('Member Number');
    for (var j = 1; j < auRows.length; j++) {
      var existEmail = String(auRows[j][auEmail]).toLowerCase();
      var existNum   = normMemberNum_(auRows[j][auNum]);
      if (existEmail === email || existNum === inputNum)
        return jsonResponse({ ok: false, error: 'An account already exists for this member. Use Forgot your PIN or contact the Pro Shop.' });
    }
    var fullName = (String(memberRow[cFirst] || '') + ' ' + String(memberRow[cLast] || '')).trim();
    auSh.appendRow(sanitizeRow_([email, pin, 'member', fullName, '', storedNum, String(memberRow[cMem] || ''), String(memberRow[cHcp] || '')]));
    return jsonResponse({ ok: true });
  }

  if (data.action === 'save-ops-data') {
    if (!requireStaffAuth_(data)) return jsonResponse({ ok: false, error: 'Not authorized.' });
    if (!data.key) return jsonResponse({ ok: false, error: 'missing key' });
    if (data.key === 'staff_pin') return jsonResponse({ ok: false, error: 'forbidden' });
    opsSave_(data.key, data.data);
    return jsonResponse({ ok: true });
  }

  if (data.action === 'save-live-scoring') {
    if (!requireStaffAuth_(data)) return jsonResponse({ ok: false, error: 'Not authorized.' });
    opsSave_('live_scoring', data);
    return jsonResponse({ ok: true });
  }

  if (data.action === 'save-lesson') {
    var LESSON_HEADERS = ['ID','First Name','Last Name','Phone','Email','Lesson Type','Skill Level','Preferred Days','Notes','Status','Source','Submitted'];
    var lSh = ss.getSheetByName('Lesson Requests');
    if (!lSh) {
      lSh = ss.insertSheet('Lesson Requests');
      lSh.appendRow(LESSON_HEADERS);
      lSh.setFrozenRows(1);
      lSh.getRange(1,1,1,LESSON_HEADERS.length).setBackground('#1a4726').setFontColor('#f5f0e8').setFontWeight('bold');
    }
    // The sheet may pre-date this code with a different column order (older
    // deployments auto-created it Email-before-Phone with no Status column),
    // so write by header name and add any missing headers first.
    var lHdrs = lSh.getRange(1, 1, 1, Math.max(1, lSh.getLastColumn())).getValues()[0];
    LESSON_HEADERS.forEach(function(h) {
      if (lHdrs.indexOf(h) === -1) {
        lSh.getRange(1, lHdrs.length + 1).setValue(h);
        lHdrs.push(h);
      }
    });
    var lessonId = data.id || Utilities.getUuid();
    var lRow = new Array(lHdrs.length).fill('');
    function setLes(name, val) { var i = lHdrs.indexOf(name); if (i >= 0) lRow[i] = val; }
    setLes('ID',             lessonId);
    setLes('First Name',     data.firstName     || '');
    setLes('Last Name',      data.lastName      || '');
    setLes('Phone',          data.phone         || '');
    setLes('Email',          data.email         || '');
    setLes('Lesson Type',    data.lessonType    || '');
    setLes('Skill Level',    data.skillLevel    || '');
    setLes('Preferred Days', data.preferredDays || '');
    setLes('Notes',          data.notes         || '');
    setLes('Status',         'New');
    setLes('Source',         data.source        || 'website');
    setLes('Submitted',      data.timestamp     || new Date().toISOString());
    lSh.appendRow(sanitizeRow_(lRow));
    try {
      var proEmail = data.proEmail || '';
      var notifyAddrs = ['sctr1217@gmail.com', 'mfiehtner@westwoodhillscountryclub.com'];
      if (proEmail) notifyAddrs.push(proEmail);
      var typeMap = { private:'Private (1-on-1)', playing:'Playing Lesson', group:'Group Clinic', junior:'Junior Program', other:'Other' };
      var skillMap = { beginner:'Beginner', intermediate:'Intermediate', low:'Low Handicap', junior:'Junior' };
      MailApp.sendEmail({
        to: notifyAddrs.join(','),
        subject: 'New Lesson Request: ' + data.firstName + ' ' + data.lastName + ' - ' + (typeMap[data.lessonType] || data.lessonType || 'Lesson'),
        body: 'New lesson request submitted:\n\n' +
          'Name: '          + data.firstName + ' ' + data.lastName + '\n' +
          'Phone: '         + (data.phone || '-') + '\n' +
          'Email: '         + (data.email || '-') + '\n' +
          'Lesson Type: '   + (typeMap[data.lessonType] || data.lessonType || '-') + '\n' +
          'Skill Level: '   + (skillMap[data.skillLevel] || data.skillLevel || '-') + '\n' +
          'Preferred Days: '+ (data.preferredDays || '-') + '\n' +
          'Notes: '         + (data.notes || '-') + '\n\n' +
          'Submitted: ' + (data.timestamp || '')
      });
      if (data.email) {
        MailApp.sendEmail({
          to: data.email,
          subject: 'Lesson Request Received - Westwood Hills Country Club',
          htmlBody:
            '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#222;">' +
            '<div style="background:#1a2b1f;padding:24px 32px;">' +
              '<p style="font-family:\'Cormorant Garamond\',Georgia,serif;font-size:22px;color:#b8976a;margin:0;">Westwood Hills Country Club</p>' +
              '<p style="color:rgba(245,240,232,.6);font-size:12px;margin:4px 0 0;">Golf Pro Shop · Poplar Bluff, Missouri</p>' +
            '</div>' +
            '<div style="padding:28px 32px;background:#fff;">' +
              '<p>Dear ' + escapeHtml_(data.firstName) + ',</p>' +
              '<p>We\'ve received your lesson request! Our golf professional will be in touch within one business day to schedule your session.</p>' +
              '<p><strong>Your request:</strong><br>' +
              'Lesson type: ' + escapeHtml_(typeMap[data.lessonType] || data.lessonType || '-') + '<br>' +
              (data.preferredDays ? 'Preferred days: ' + escapeHtml_(data.preferredDays) + '<br>' : '') +
              (data.notes ? 'Notes: ' + escapeHtml_(data.notes) : '') +
              '</p>' +
              '<p>In the meantime, feel free to call the pro shop at <a href="tel:+15737858211">(573) 785-8211</a>.</p>' +
              '<p style="margin-top:28px;">Warm regards,<br><strong>Westwood Hills Country Club Pro Shop</strong></p>' +
            '</div>' +
            '</div>'
        });
      }
    } catch(mailErr) {
      Logger.log('MailApp error (lesson): ' + mailErr.toString());
    }
    return jsonResponse({ ok: true, id: lessonId });
  }

  if (data.action === 'update-lesson-status') {
    if (!requireStaffAuth_(data)) return jsonResponse({ ok: false, error: 'Not authorized.' });
    var lSh2 = ss.getSheetByName('Lesson Requests');
    if (!lSh2) return jsonResponse({ ok: false, error: 'sheet not found' });
    var lRows = lSh2.getDataRange().getValues();
    var lHdr  = lRows[0];
    var lId   = lHdr.indexOf('ID');
    if (lId < 0) return jsonResponse({ ok: false, error: 'columns missing' });
    var lStat = lHdr.indexOf('Status');
    if (lStat < 0) {
      lSh2.getRange(1, lHdr.length + 1).setValue('Status');
      lStat = lHdr.length;
    }
    for (var li = 1; li < lRows.length; li++) {
      if (String(lRows[li][lId]) === String(data.id)) {
        lSh2.getRange(li + 1, lStat + 1).setValue(data.status || 'New');
        return jsonResponse({ ok: true });
      }
    }
    return jsonResponse({ ok: false, error: 'not found' });
  }

  if (data.action === 'delete-dining') {
    if (!requireStaffAuth_(data)) return jsonResponse({ ok: false, error: 'Not authorized.' });
    var dDel = getOrCreateDiningSheet();
    var dDelRows = dDel.getDataRange().getValues();
    var dDelHdr  = dDelRows[0];
    var dDelId   = dDelHdr.indexOf('ID');
    if (dDelId >= 0) {
      for (var ddi = 1; ddi < dDelRows.length; ddi++) {
        if (String(dDelRows[ddi][dDelId]) === String(data.id)) {
          dDel.deleteRow(ddi + 1);
          return jsonResponse({ ok: true });
        }
      }
    }
    return jsonResponse({ ok: false, error: 'not found' });
  }

  if (data.action === 'update-dining-full') {
    if (!requireStaffAuth_(data)) return jsonResponse({ ok: false, error: 'Not authorized.' });
    var dFull = getOrCreateDiningSheet();
    var dFRows = dFull.getDataRange().getValues();
    var dFHdr  = dFRows[0];
    var dFId   = dFHdr.indexOf('ID');
    if (dFId < 0) return jsonResponse({ ok: false, error: 'no ID column' });
    var dFUpdates = {
      'Date':         data.date        || '',
      'Time':         data.time24      || '',
      'Time Display': data.timeDisplay || data.time24 || '',
      'First Name':   data.firstName   || '',
      'Last Name':    data.lastName    || '',
      'Email':        data.email       || '',
      'Phone':        data.phone       || '',
      'Party Size':   data.party       || 1,
      'Member':       data.member      || '',
      'Venue':        data.venue       || '',
      'Notes':        data.note        || '',
      'Status':       data.status      || 'Pending'
    };
    for (var dfi = 1; dfi < dFRows.length; dfi++) {
      if (String(dFRows[dfi][dFId]) !== String(data.id)) continue;
      for (var col in dFUpdates) {
        var ci = dFHdr.indexOf(col);
        if (ci >= 0) dFull.getRange(dfi + 1, ci + 1).setValue(sanitizeCell_(dFUpdates[col]));
      }
      return jsonResponse({ ok: true });
    }
    return jsonResponse({ ok: false, error: 'not found' });
  }

  if (data.action === 'save-waitlist') {
    if (!requireStaffAuth_(data)) return jsonResponse({ ok: false, error: 'Not authorized.' });
    opsSave_('waitlist', data.data);
    return jsonResponse({ ok: true });
  }

  if (data.action === 'save-guest-notes') {
    if (!requireStaffAuth_(data)) return jsonResponse({ ok: false, error: 'Not authorized.' });
    opsSave_('guest_notes', data.data);
    return jsonResponse({ ok: true });
  }

  if (data.action === 'save-pairings') {
    if (!requireStaffAuth_(data)) return jsonResponse({ ok: false, error: 'Not authorized.' });
    opsSave_('pairings', data.data);
    return jsonResponse({ ok: true });
  }

  // POST variants of staff-only reads (mirrors the GET actions of the same
  // name below in doGet) so the staff PIN travels in the POST body instead
  // of a URL query string, matching validate-staff-pin/validate-board-pin.
  if (data.action === 'get-waitlist') {
    if (!requireStaffAuth_(data)) return jsonResponse({ error: 'Not authorized.' });
    var val = opsGet_('waitlist');
    return jsonResponse(val !== null ? val : []);
  }

  if (data.action === 'get-guest-notes') {
    if (!requireStaffAuth_(data)) return jsonResponse({ error: 'Not authorized.' });
    var val = opsGet_('guest_notes');
    return jsonResponse(val !== null ? val : []);
  }

  if (data.action === 'get-pairings') {
    if (!requireStaffAuth_(data)) return jsonResponse({ error: 'Not authorized.' });
    var val = opsGet_('pairings');
    return jsonResponse(val !== null ? val : {});
  }

  if (data.action === 'get-event-rsvps') {
    if (!requireStaffAuth_(data)) return jsonResponse({ error: 'Not authorized.' });
    var gerSh = getOrCreateEventRsvpSheet_();
    var gerVals = gerSh.getDataRange().getValues();
    if (gerVals.length <= 1) return jsonResponse([]);
    var gerHdrs = gerVals[0];
    var gerResult = [];
    for (var geri = 1; geri < gerVals.length; geri++) {
      var gerObj = {};
      for (var gerj = 0; gerj < gerHdrs.length; gerj++) {
        var gerV = gerVals[geri][gerj];
        gerObj[gerHdrs[gerj]] = (gerV instanceof Date) ? gerV.toISOString() : String(gerV === null || gerV === undefined ? '' : gerV);
      }
      gerResult.push(gerObj);
    }
    return jsonResponse(gerResult);
  }

  if (data.action === 'get-live-scoring') {
    if (!requireStaffAuth_(data)) return jsonResponse({ error: 'Not authorized.' });
    var val = opsGet_('live_scoring');
    return jsonResponse(val !== null ? val : {});
  }

  if (data.action === 'get-teesheets') {
    if (!requireStaffAuth_(data)) return jsonResponse({ error: 'Not authorized.' });
    var gtsSh   = getTeeSheet();
    var gtsVals = gtsSh.getDataRange().getValues();
    if (gtsVals.length <= 1) return jsonResponse([]);
    var gtsEventFilter = data.event || '';
    var gtsResult = [];
    for (var gtsi = 1; gtsi < gtsVals.length; gtsi++) {
      if (gtsEventFilter && String(gtsVals[gtsi][0]) !== gtsEventFilter) continue;
      gtsResult.push({
        event:   String(gtsVals[gtsi][0]),
        round:   String(gtsVals[gtsi][1]),
        date:    String(gtsVals[gtsi][2]),
        config:  gtsVals[gtsi][3] ? JSON.parse(gtsVals[gtsi][3]) : {},
        groups:  gtsVals[gtsi][4] ? JSON.parse(gtsVals[gtsi][4]) : [],
        savedAt: String(gtsVals[gtsi][5])
      });
    }
    return jsonResponse(gtsResult);
  }

  if (data.action === 'get-dining') {
    if (!requireStaffAuth_(data)) return jsonResponse({ error: 'Not authorized.' });
    var gdSheet = getOrCreateDiningSheet();
    if (gdSheet.getLastRow() <= 1) return jsonResponse([]);
    var gdVals = gdSheet.getDataRange().getValues();
    var gdHdrs = gdVals[0];
    var gdTz   = Session.getScriptTimeZone();
    var gdResult = [];
    for (var gdi = 1; gdi < gdVals.length; gdi++) {
      var gdObj = {};
      for (var gdj = 0; gdj < gdHdrs.length; gdj++) {
        var gdV = gdVals[gdi][gdj];
        var gdH = gdHdrs[gdj];
        if (gdV instanceof Date) {
          gdObj[gdH] = (gdH === 'Time' || gdH === 'Time Display')
            ? Utilities.formatDate(gdV, gdTz, 'h:mm a')
            : Utilities.formatDate(gdV, gdTz, 'yyyy-MM-dd');
        } else {
          gdObj[gdH] = String(gdV === null || gdV === undefined ? '' : gdV);
        }
      }
      gdResult.push(gdObj);
    }
    return jsonResponse(gdResult);
  }

  if (data.action === 'get-lessons') {
    if (!requireStaffAuth_(data)) return jsonResponse({ error: 'Not authorized.' });
    var glSh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Lesson Requests');
    if (!glSh || glSh.getLastRow() <= 1) return jsonResponse([]);
    var glVals = glSh.getDataRange().getValues();
    var glHdrs = glVals[0];
    var glResult = [];
    for (var gli = 1; gli < glVals.length; gli++) {
      var glObj = {};
      for (var glj = 0; glj < glHdrs.length; glj++) {
        var glV = glVals[gli][glj];
        glObj[glHdrs[glj]] = (glV instanceof Date) ? glV.toISOString() : String(glV === null || glV === undefined ? '' : glV);
      }
      glResult.push(glObj);
    }
    return jsonResponse(glResult);
  }

  if (data.action === 'save-pin') {
    if (pinRateLimited_('staffpin_fail')) return jsonResponse({ ok: false, error: 'Too many attempts. Try again later.', locked: true });
    if (!data.pin || !/^\d{4}$/.test(String(data.pin))) return jsonResponse({ ok: false, error: 'invalid pin' });
    // Changing the PIN requires the current PIN or the Board recovery code;
    // setting it is open only while no PIN exists at all.
    var existingPin = opsGet_('staff_pin');
    var pinAuthorized = existingPin === null || existingPin === '' ||
                        String(data.current || '') === String(existingPin);
    if (!pinAuthorized && data.boardCode) {
      var setSh = ss.getSheetByName('Settings');
      var recovery = setSh ? String(setSh.getRange('B1').getValue()).trim() : '';
      pinAuthorized = recovery !== '' && String(data.boardCode).trim() === recovery;
    }
    if (!pinAuthorized) { recordPinFailure_('staffpin_fail'); return jsonResponse({ ok: false, error: 'not authorized' }); }
    clearPinFailures_('staffpin_fail');
    opsSave_('staff_pin', String(data.pin));
    return jsonResponse({ ok: true });
  }

  if (data.action === 'send-dining-confirm') {
    // The dining-reservation handler already emails the guest their confirmation.
    // Acknowledge so the mobile app's follow-up call doesn't hit the fallback below.
    return jsonResponse({ ok: true });
  }

  if (data.action === 'save-league-reg') {
    var lg = data.data || {};
    var LEAGUE_HEADERS = ['Timestamp','League','Member','Email','Team','Notes'];
    var lgSh = ss.getSheetByName('League Regs');
    if (!lgSh) {
      lgSh = ss.insertSheet('League Regs');
      lgSh.appendRow(LEAGUE_HEADERS);
      lgSh.setFrozenRows(1);
      lgSh.getRange(1,1,1,LEAGUE_HEADERS.length).setBackground('#1a4726').setFontColor('#f5f0e8').setFontWeight('bold');
    }
    var lgHdrs = lgSh.getRange(1, 1, 1, Math.max(1, lgSh.getLastColumn())).getValues()[0];
    var lgRow = new Array(lgHdrs.length).fill('');
    function setLg(name, val) { var i = lgHdrs.indexOf(name); if (i >= 0) lgRow[i] = val || ''; }
    setLg('Timestamp', new Date().toISOString());
    setLg('League', lg.league || '');
    setLg('Member', lg.member || lg.name || '');
    setLg('Email',  lg.email  || '');
    setLg('Team',   lg.team   || '');
    setLg('Notes',  lg.notes  || '');
    lgSh.appendRow(sanitizeRow_(lgRow));
    return jsonResponse({ ok: true });
  }

  // Unrecognized actions must not fall through to the registration append —
  // that silently writes junk rows and makes the caller believe it succeeded.
  if (data.action) return jsonResponse({ error: 'unknown action: ' + data.action });

  // Default: save registration (event signups post their fields with no action key)
  getRegSheet().appendRow(sanitizeRow_([
    data.id, data.event, data.eventMeta, data.firstName, data.lastName,
    data.email, data.phone, data.partner, data.players, data.memberNum,
    data.ghin, data.notes, data.timestamp, data.source
  ]));
  return jsonResponse({ status: 'ok' });
}

// ── OPS DATA (generic key/value blob store) ───────────────────────────────────

function getOpsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Ops Data');
  if (!sh) {
    sh = ss.insertSheet('Ops Data');
    sh.appendRow(['Key', 'Data', 'Updated']);
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,3).setBackground('#1a4726').setFontColor('#f5f0e8').setFontWeight('bold');
    sh.setColumnWidth(1, 180);
    sh.setColumnWidth(2, 400);
    sh.setColumnWidth(3, 160);
  }
  return sh;
}

function opsGet_(key) {
  var sh = getOpsSheet_();
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === key) {
      try { return JSON.parse(rows[i][1]); } catch(e) { return null; }
    }
  }
  return null;
}

function opsSave_(key, data) {
  var sh = getOpsSheet_();
  var rows = sh.getDataRange().getValues();
  var json = JSON.stringify(data);
  var now  = new Date().toISOString();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === key) {
      sh.getRange(i + 1, 2, 1, 2).setValues([[json, now]]);
      return;
    }
  }
  sh.appendRow([key, json, now]);
}

// ── UTILITIES ─────────────────────────────────────────────────────────────────

function fixSheetHeaders() {
  var sh = getRegSheet();
  var correct = [
    'ID','Event','Event Date/Time','First Name','Last Name',
    'Email','Phone','Partner','Players','Member #',
    'GHIN Handicap','Notes','Registered At','Source'
  ];
  if (sh.getLastColumn() < correct.length) {
    sh.getRange(1, sh.getLastColumn()+1, 1, correct.length - sh.getLastColumn())
      .setValues([correct.slice(sh.getLastColumn())]);
  }
  sh.getRange(1, 1, 1, correct.length).setValues([correct]);
  Logger.log('Headers fixed: ' + correct.join(' | '));
}

function testEmail() {
  Logger.log('Remaining quota: ' + MailApp.getRemainingDailyQuota());
  Logger.log('Running as: ' + Session.getEffectiveUser().getEmail());
  MailApp.sendEmail({
    to: 'sctr1217@gmail.com',
    subject: 'WHCC Apps Script Test',
    body: 'If you receive this, MailApp is working correctly.'
  });
  Logger.log('Send call completed.');
}

function getOrCreateSpecialsSheet_() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Specials');
  if (!sheet) {
    sheet = ss.insertSheet('Specials');
    sheet.appendRow(['Key', 'Value']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function setSpecialsValue_(sheet, key, value) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === key) {
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(value));
      return;
    }
  }
  sheet.appendRow([key, JSON.stringify(value)]);
}

function getSpecialsValue_(sheet, key) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === key) {
      try { return JSON.parse(String(data[i][1])); }
      catch(e) { return {}; }
    }
  }
  return {};
}

function getOrCreateEventRsvpSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Event RSVPs');
  if (!sh) {
    sh = ss.insertSheet('Event RSVPs');
    sh.appendRow(['ID','Timestamp','Event Name','Event Date','First Name','Last Name','Email','Phone']);
    sh.setFrozenRows(1);
  }
  return sh;
}

// Run this once from the Apps Script editor to enable daily reminder emails.
function setupDailyReminders() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'sendDailyReminders') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendDailyReminders')
    .timeBased().everyDays(1).atHour(9).create();
  Logger.log('Daily reminder trigger created — runs at 9 AM each day.');
}

// Sends reminder emails for dining reservations and event RSVPs happening tomorrow.
function sendDailyReminders() {
  var ss       = SpreadsheetApp.getActiveSpreadsheet();
  var tz       = Session.getScriptTimeZone();
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var tomorrowStr = Utilities.formatDate(tomorrow, tz, 'yyyy-MM-dd');
  var tomorrowDisp = Utilities.formatDate(tomorrow, tz, 'MMMM d, yyyy');

  // Dining reservation reminders
  var dSh = ss.getSheetByName('Dining Reservations');
  if (dSh) {
    var dVals = dSh.getDataRange().getValues();
    var dHdrs = dVals[0];
    var dDateC  = dHdrs.indexOf('Date');
    var dStatC  = dHdrs.indexOf('Status');
    var dEmailC = dHdrs.indexOf('Email');
    var dFnC    = dHdrs.indexOf('First Name');
    var dVenC   = dHdrs.indexOf('Venue');
    var dTimeC  = dHdrs.indexOf('Time Display');
    var dPartyC = dHdrs.indexOf('Party Size');
    for (var di = 1; di < dVals.length; di++) {
      var dDate   = diningDateStr_(dVals[di][dDateC]);
      var dStatus = String(dVals[di][dStatC] || '');
      if (dDate !== tomorrowStr) continue;
      if (dStatus === 'Cancelled') continue;
      var dEmail = String(dVals[di][dEmailC] || '');
      if (!dEmail) continue;
      var dFirst = String(dVals[di][dFnC]    || 'Guest');
      var dVen   = venueDisplay_(dVals[di][dVenC]);
      var dTime  = String(dVals[di][dTimeC]  || '');
      var dParty = String(dVals[di][dPartyC] || '');
      try {
        MailApp.sendEmail({
          to: dEmail,
          subject: 'Reminder: your dining reservation tomorrow — Westwood Hills',
          htmlBody:
            '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#222;">' +
            '<div style="background:#1a2b1f;padding:24px 32px;">' +
              '<p style="font-family:\'Cormorant Garamond\',Georgia,serif;font-size:22px;color:#b8976a;margin:0;">Westwood Hills Country Club</p>' +
              '<p style="color:rgba(245,240,232,.6);font-size:12px;margin:4px 0 0;">Poplar Bluff, Missouri</p>' +
            '</div>' +
            '<div style="padding:28px 32px;background:#fff;">' +
              '<p>Hi ' + escapeHtml_(dFirst) + ',</p>' +
              '<p>Just a reminder — you have a dining reservation at <strong>' + escapeHtml_(dVen) + '</strong> tomorrow, <strong>' + tomorrowDisp + '</strong>' + (dTime ? ' at ' + escapeHtml_(dTime) : '') + (dParty ? ' for ' + escapeHtml_(dParty) + (dParty === '1' ? ' guest' : ' guests') : '') + '.</p>' +
              '<p style="font-size:13px;color:#666;">Need to change or cancel? Call us at <a href="tel:+15737855253">(573) 785-5253</a>.</p>' +
              '<p style="margin-top:28px;">See you tomorrow,<br><strong>Westwood Hills Country Club</strong></p>' +
            '</div>' +
            '</div>'
        });
      } catch(e) { Logger.log('Dining reminder error: ' + e.toString()); }
    }
  }

  // Event RSVP reminders
  var rSh = ss.getSheetByName('Event RSVPs');
  if (rSh) {
    var rVals = rSh.getDataRange().getValues();
    var rHdrs = rVals[0];
    var rEvtC   = rHdrs.indexOf('Event Name');
    var rDateC  = rHdrs.indexOf('Event Date');
    var rEmailC = rHdrs.indexOf('Email');
    var rFnC    = rHdrs.indexOf('First Name');
    for (var ri = 1; ri < rVals.length; ri++) {
      var rDateRaw = String(rVals[ri][rDateC] || '');
      var rEmail   = String(rVals[ri][rEmailC] || '');
      if (!rEmail) continue;
      // Try to parse the stored date and compare to tomorrow
      var parsed = new Date(rDateRaw);
      if (isNaN(parsed.getTime())) continue;
      var parsedStr = Utilities.formatDate(parsed, tz, 'yyyy-MM-dd');
      if (parsedStr !== tomorrowStr) continue;
      var rEvt   = String(rVals[ri][rEvtC] || 'the event');
      var rFirst = String(rVals[ri][rFnC]  || 'Guest');
      try {
        MailApp.sendEmail({
          to: rEmail,
          subject: 'Reminder: ' + rEvt + ' is tomorrow — Westwood Hills',
          htmlBody:
            '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#222;">' +
            '<div style="background:#1a2b1f;padding:24px 32px;">' +
              '<p style="font-family:\'Cormorant Garamond\',Georgia,serif;font-size:22px;color:#b8976a;margin:0;">Westwood Hills Country Club</p>' +
              '<p style="color:rgba(245,240,232,.6);font-size:12px;margin:4px 0 0;">Poplar Bluff, Missouri</p>' +
            '</div>' +
            '<div style="padding:28px 32px;background:#fff;">' +
              '<p>Hi ' + escapeHtml_(rFirst) + ',</p>' +
              '<p>Just a reminder — <strong>' + escapeHtml_(rEvt) + '</strong> is tomorrow, <strong>' + tomorrowDisp + '</strong>. We hope to see you there!</p>' +
              '<p style="font-size:13px;color:#666;">Questions? Call us at <a href="tel:+15737855253">(573) 785-5253</a>.</p>' +
              '<p style="margin-top:28px;">See you tomorrow,<br><strong>Westwood Hills Country Club</strong></p>' +
            '</div>' +
            '</div>'
        });
      } catch(e) { Logger.log('Event reminder error: ' + e.toString()); }
    }
  }
}
