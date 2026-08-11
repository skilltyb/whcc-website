/**
 * ⚠ SUPERSEDED — DO NOT PASTE INTO Code.gs ⚠
 * This fix (setSharing() on upload-photo, plus the make-photos-public case)
 * is already merged into Code.gs. Re-pasting this would redeclare those
 * handlers a second time — harmless only if identical to what's already
 * there, and a real bug risk otherwise. Kept here for historical reference.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * WESTWOOD HILLS CC — Apps Script: Fix Photo Library (make Drive files public)
 * ─────────────────────────────────────────────────────────────────────────────
 * Problem: photos uploaded to Drive are private by default, so thumbnails
 * show as broken images in the staff Library.
 *
 * Fix: two changes to the doPost switch in your Apps Script:
 *   1. Add .setSharing() to the upload-photo case so new uploads are public.
 *   2. Add a new make-photos-public case for a one-time migration of existing files.
 *
 * STEP 1 — Apply the changes below to your Apps Script (script.google.com).
 * STEP 2 — Deploy > Manage deployments > Edit > New version > Deploy.
 * STEP 3 — In the Staff Portal → Photos → Library, click "Make All Photos Public"
 *           once to fix the existing files.
 */


// ── CHANGE 1: In the existing 'upload-photo' case, add ONE LINE after createFile ──
// Find this block (already in your script):
//
//   case 'upload-photo':
//     ...
//     var file = folder.createFile(blob);
//     ← ADD THIS LINE IMMEDIATELY BELOW:
//     file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
//     ...
//     return jsonResponse({ ok: true, url: '...', id: file.getId() });
//
// That single line makes every newly uploaded photo publicly viewable by link.


// ── CHANGE 2: Add this NEW case inside your doPost switch ────────────────────────

/*
    case 'make-photos-public':
      var mpFolders = DriveApp.getFoldersByName('WHCC Photos');
      if (!mpFolders.hasNext()) return jsonResponse({ ok: true, count: 0 });
      var mpFolder = mpFolders.next();
      var mpFiles  = mpFolder.getFiles();
      var mpCount  = 0;
      while (mpFiles.hasNext()) {
        mpFiles.next().setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        mpCount++;
      }
      return jsonResponse({ ok: true, count: mpCount });
*/
