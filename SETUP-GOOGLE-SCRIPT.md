# Setting Up the Google Apps Script Backend

> **This doc previously included a full inline copy of the backend code.
> That copy is now badly out of date — the real backend (`Code.gs` in this
> repo) has grown far beyond registrations to also handle dining
> reservations, lesson requests, the staff CMS, live scoring, menus, photo
> uploads, member login, and more. Rather than duplicate code here (which
> will just go stale again), this doc now just points at the real file.**

## Step 1: Create the Google Sheet

1. Go to sheets.google.com and create a new spreadsheet.
2. You don't need to pre-create any tabs or headers — `Code.gs` creates
   whatever sheets it needs on first use. The sheets it manages are:
   - A registrations sheet (auto-detected by header — see `getRegSheet()`
     in `Code.gs`; the first sheet with an `Event` or `First Name` column,
     excluding `Tee Sheets` and `Dining Reservations`)
   - `Tee Sheets`, `Dining Reservations`, `Conditions`, `Menus`,
     `Site Content`, `Contact Inquiries`, `Lesson Requests`,
     `League Regs`, `Event RSVPs`, `Ops Data`, `Specials`
   - `App Users` and `Members` (for member login / PIN self-service)
   - `Settings` (holds the board PIN-recovery code in cell B1)

## Step 2: Deploy the Apps Script

1. In the spreadsheet, go to **Extensions → Apps Script**.
2. Delete the default `Code.gs` content and paste in the **current**
   `Code.gs` from this repo (`C:\Users\sctr1\claude\Code.gs`) in full.
3. Click **Deploy → New deployment** (first time only):
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy** and copy the Web App URL.

### Updating an existing deployment

Once a deployment already exists, **do not create a new one** — that
changes the URL and breaks every client pointing at the old one. Instead:
**Deploy → Manage deployments → (pencil icon on the existing deployment)
→ Version: New version → Deploy.**

## Step 3: Point the site at your deployment

In `index.html`, find:

```js
var WHCC_SCRIPT_URL = 'https://script.google.com/macros/s/.../exec';
```

Replace the URL with your deployment's Web App URL from Step 2.

## Golf Genius Integration

Golf Genius accepts CSV imports. Use the "⬇ CSV" button in the staff
portal's Registrations tab to download a CSV, then import it into Golf
Genius under Tournament → Field → Import Players.

## Tee Sheet Sync

The website and companion mobile app both read/write the same `Tee Sheets`
tab via this same Apps Script deployment, so tee sheets and scores stay in
sync across platforms automatically — no separate setup needed.
