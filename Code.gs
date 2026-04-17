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
  Logger.log('Done — App Users sheet ready.');
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function getRegSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    if (name === 'Tee Sheets') continue;
    if (name === 'Dining Reservations') continue;
    if (sheets[i].getLastRow() < 1) continue;
    var headers = sheets[i].getRange(1, 1, 1, Math.max(1, sheets[i].getLastColumn())).getValues()[0];
    for (var j = 0; j < headers.length; j++) {
      if (headers[j] === 'Event' || headers[j] === 'First Name') return sheets[i];
    }
  }
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName() !== 'Tee Sheets' && sheets[i].getName() !== 'Dining Reservations') return sheets[i];
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

function diningNormStatus_(s) {
  if (!s) return 'Pending';
  var t = String(s).trim();
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
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
    var code = e.parameter.code || '';
    if (!code) return jsonResponse({ ok: false, error: 'No code provided' });
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sh = ss.getSheetByName('Settings');
      if (!sh) return jsonResponse({ ok: false, error: 'Settings sheet not found' });
      var storedCode = sh.getRange('B1').getValue().toString().trim();
      if (storedCode && code === storedCode) {
        return jsonResponse({ ok: true });
      } else {
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

  if (action === 'validate-login') {
    var loginEmail = (e.parameter.email || '').toLowerCase().trim();
    var loginPin   = (e.parameter.pin   || '').trim();
    if (!loginEmail || !loginPin) return jsonResponse({ ok: false, error: 'missing fields' });
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
    var key = e.parameter.key || '';
    if (!key) return jsonResponse({ error: 'missing key' });
    var val = opsGet_(key);
    return jsonResponse(val !== null ? val : []);
  }

  if (action === 'get-all-ops') {
    var sh = getOpsSheet_();
    var rows = sh.getDataRange().getValues();
    var result = {};
    for (var i = 1; i < rows.length; i++) {
      try { result[String(rows[i][0])] = JSON.parse(rows[i][1]); } catch(e) {}
    }
    return jsonResponse(result);
  }

  if (action === 'get-live-scoring') {
    var val = opsGet_('live_scoring');
    return jsonResponse(val !== null ? val : {});
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
    sh.appendRow([data.submitted || data.timestamp || new Date().toISOString(), data.name, data.email, data.phone, data.subject, data.message, 'New']);
    try {
      if (data.email) {
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
              '<p>Dear ' + data.name + ',</p>' +
              '<p>Thank you for reaching out to Westwood Hills Country Club. We have received your inquiry and a member of our team will be in touch soon.</p>' +
              '<p><strong>Your message:</strong><br><em>' + data.message + '</em></p>' +
              '<p>In the meantime, feel free to call us at <a href="tel:+15737855253">(573) 785-5253</a> or visit us at the club.</p>' +
              '<p style="margin-top:28px;">Warm regards,<br><strong>Westwood Hills Country Club</strong><br>Poplar Bluff, Missouri</p>' +
            '</div>' +
            '</div>'
        });
      }
      MailApp.sendEmail({
        to: 'sctr1217@gmail.com',
        subject: 'New Contact Inquiry: ' + data.subject + ' — ' + data.name,
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

  if (data.action === 'upload-photo') {
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

  if (data.action === 'delete-photo') {
    try {
      DriveApp.getFileById(data.fileId).setTrashed(true);
      return jsonResponse({ ok: true });
    } catch(err) {
      return jsonResponse({ ok: false, error: err.toString() });
    }
  }

  if (data.action === 'clear-test') {
    var sh = getRegSheet();
    var rows = sh.getDataRange().getValues();
    var toDelete = [];
    for (var i = rows.length - 1; i >= 1; i--) {
      if (String(rows[i][13]).toLowerCase() === 'website') toDelete.push(i + 1);
    }
    toDelete.forEach(function(r){ sh.deleteRow(r); });
    return jsonResponse({ status: 'cleared' });
  }

  if (data.action === 'delete') {
    var sh = getRegSheet();
    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.id) { sh.deleteRow(i + 1); break; }
    }
    return jsonResponse({ status: 'deleted' });
  }

  if (data.action === 'save-teesheet') {
    var sh = getTeeSheet();
    var rows = sh.getDataRange().getValues();
    var found = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.event && String(rows[i][1]) === String(data.round)) { found = i + 1; break; }
    }
    var rowData = [data.event, data.round, data.date,
                   JSON.stringify(data.config || {}),
                   JSON.stringify(data.groups || []),
                   new Date().toISOString()];
    if (found > 0) sh.getRange(found, 1, 1, 6).setValues([rowData]);
    else           sh.appendRow(rowData);
    return jsonResponse({ status: 'ok' });
  }

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
    return jsonResponse({ status: 'ok' });
  }

  if (data.action === 'dining-reservation') {
    var dSheet = getOrCreateDiningSheet();
    var hdrs = dSheet.getRange(1, 1, 1, dSheet.getLastColumn()).getValues()[0];
    var row = new Array(hdrs.length).fill('');
    function setCol(name, val) { var i = hdrs.indexOf(name); if (i >= 0) row[i] = val || ''; }
    setCol('ID',           data.id         || Utilities.getUuid());
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
    dSheet.appendRow(row);
    return jsonResponse({ ok: true });
  }

  if (data.action === 'update-dining') {
    var dSheet2 = getOrCreateDiningSheet();
    var dRows   = dSheet2.getDataRange().getValues();
    var dHdr    = dRows[0];
    var idCol   = dHdr.indexOf('ID');
    var statCol = dHdr.indexOf('Status');
    if (idCol < 0 || statCol < 0) return jsonResponse({ ok: false, error: 'columns missing' });
    for (var di = 1; di < dRows.length; di++) {
      if (String(dRows[di][idCol]) === String(data.id)) {
        dSheet2.getRange(di + 1, statCol + 1).setValue(diningNormStatus_(data.status));
        return jsonResponse({ ok: true });
      }
    }
    return jsonResponse({ ok: false, error: 'not found' });
  }

  if (data.action === 'save-specials') {
    var ssSheet = getOrCreateSpecialsSheet_();
    setSpecialsValue_(ssSheet, 'weeklySpecial', data.weeklySpecial || {});
    setSpecialsValue_(ssSheet, 'fridayNight',   data.fridayNight   || {});
    return jsonResponse({ ok: true });
  }

  if (data.action === 'save-conditions') {
    var cSh = ss.getSheetByName('Conditions');
    if (!cSh) { cSh = ss.insertSheet('Conditions'); cSh.appendRow(['Data','Updated']); cSh.setFrozenRows(1); }
    var cJson = JSON.stringify(data.data || {});
    if (cSh.getLastRow() < 2) cSh.appendRow([cJson, new Date().toISOString()]);
    else cSh.getRange(2, 1, 1, 2).setValues([[cJson, new Date().toISOString()]]);
    return jsonResponse({ ok: true });
  }

  if (data.action === 'save-menus') {
    var mSh = ss.getSheetByName('Menus');
    if (!mSh) { mSh = ss.insertSheet('Menus'); mSh.appendRow(['Data','Updated']); mSh.setFrozenRows(1); }
    var mJson = JSON.stringify(data.data || {});
    if (mSh.getLastRow() < 2) mSh.appendRow([mJson, new Date().toISOString()]);
    else mSh.getRange(2, 1, 1, 2).setValues([[mJson, new Date().toISOString()]]);
    return jsonResponse({ ok: true });
  }

  if (data.action === 'save-site-content') {
    var scSh = ss.getSheetByName('Site Content');
    if (!scSh) { scSh = ss.insertSheet('Site Content'); scSh.appendRow(['Data','Updated']); scSh.setFrozenRows(1); }
    var scJson = JSON.stringify(data.data || {});
    if (scSh.getLastRow() < 2) scSh.appendRow([scJson, new Date().toISOString()]);
    else scSh.getRange(2, 1, 1, 2).setValues([[scJson, new Date().toISOString()]]);
    return jsonResponse({ ok: true });
  }

  if (data.action === 'create-pin') {
    var email     = (data.email     || '').toLowerCase().trim();
    var memberNum = (data.memberNum || '').trim();
    var pin       = (data.pin       || '').trim();
    if (!email || !memberNum || !/^\d{4}$/.test(pin))
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
      if (normMemberNum_(mRows[i][cNum]) === inputNum) {
        memberRow = mRows[i];
        storedNum = String(mRows[i][cNum] || '').trim();
        break;
      }
    }
    if (!memberRow) return jsonResponse({ ok: false, error: 'Member not found.' });
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
    auSh.appendRow([email, pin, 'member', fullName, '', storedNum, String(memberRow[cMem] || ''), String(memberRow[cHcp] || '')]);
    return jsonResponse({ ok: true });
  }

  if (data.action === 'save-ops-data') {
    if (!data.key) return jsonResponse({ ok: false, error: 'missing key' });
    opsSave_(data.key, data.data);
    return jsonResponse({ ok: true });
  }

  if (data.action === 'save-live-scoring') {
    opsSave_('live_scoring', data);
    return jsonResponse({ ok: true });
  }

  // Default: save registration
  getRegSheet().appendRow([
    data.id, data.event, data.eventMeta, data.firstName, data.lastName,
    data.email, data.phone, data.partner, data.players, data.memberNum,
    data.ghin, data.notes, data.timestamp, data.source
  ]);
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
