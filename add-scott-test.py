"""
Adds Scott Borkgren to all applicable events with a deliberately wrong
handicap (4.2) to test the GHIN cross-reference / anti-cheat feature.
His actual GHIN handicap index is ~16.
"""
import urllib.request
import json
import random
import time

URL = 'https://script.google.com/macros/s/AKfycbxLIwXQMtgijncf-a6nnP4EsCliKGEM-yTsfja9hYFzLueQujBhevo-n8ICUHFRAEp1/exec'

FIRST, LAST = 'Scott', 'Borkgren'
EMAIL       = 'sborkgren@trcc.edu'
PHONE       = '(573) 300-0000'
MEMBER_NUM  = '001'
FAKE_HCP    = '4.2'     # intentionally wrong — real is ~16
GHIN_NUM    = '11409297'  # Scott's actual GHIN membership number

def post(data):
    body = json.dumps(data).encode('utf-8')
    req  = urllib.request.Request(URL, data=body, headers={'Content-Type': 'text/plain'}, method='POST')
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return json.loads(resp.read().decode())
    except Exception as ex:
        return {'error': str(ex)}

def reg(event, meta, players='1', partner=''):
    return {
        'id':        f'SCOTT-{event[:6].replace(" ","")}-{random.randint(1000,9999)}',
        'event':     event,
        'eventMeta': meta,
        'firstName': FIRST,
        'lastName':  LAST,
        'email':     EMAIL,
        'phone':     PHONE,
        'partner':   partner,
        'players':   players,
        'memberNum': MEMBER_NUM,
        'ghin':      FAKE_HCP,
        'notes':     f'TEST — GHIN #{GHIN_NUM} — handicap intentionally wrong for GHIN verification demo',
        'timestamp': '2026-03-15T09:00:00.000Z',
        'source':    'website'
    }

entries = [
    # Singles
    reg("St. Patty's Shootout",   "Mar 14 · 10:30 AM – 2:30 PM"),
    reg("Masters Dinner",          "Apr 8 · 6:30 – 9:30 PM"),
    reg("MGA Draft Day",           "Apr 17 · 6:00 – 10:00 PM"),
    reg("Men's Opening Day",       "Apr 18 · 9:30 AM – 2:00 PM"),
    reg("Club Championship",       "Aug 1–2 · Club Tournament"),
    # Twosomes (Scott + partner)
    reg("Spring 2-Man Scramble",   "Apr 12 · 9:00 AM – 2:00 PM", "2", "Chris Borkgren"),
    reg("Ozark Invitational",      "Apr 25–26 · 2-Day Tournament", "2", "Chris Borkgren"),
    reg("Couples Scramble",        "Jun 6 · 9:00 AM – 2:00 PM",   "2", "Lisa Borkgren"),
    reg("4th of July Scramble",    "Jul 4 · 8:00 AM – 1:00 PM",   "2", "Chris Borkgren"),
    reg("Member-Guest",            "Jul 18–19 · 2-Day Tournament", "2", "Chris Borkgren"),
    reg("Fall 2-Man Scramble",     "Sep 12 · 9:00 AM – 2:00 PM",  "2", "Chris Borkgren"),
    reg("Senior Scramble",         "Sep 26 · 9:00 AM – 1:00 PM",  "2", "Chris Borkgren"),
    reg("Halloween Costume Scramble", "Oct 31 · 10:00 AM – 3:00 PM", "2", "Lisa Borkgren"),
    # Foursomes
    reg("Mules Invitational",      "Apr 13 · 9:00 AM – 2:00 PM",  "4", "Chris Borkgren, Dave Perkins, Ron Fletcher"),
    reg("Closing Day Scramble",    "Oct 10 · 9:00 AM – 2:00 PM",  "4", "Chris Borkgren, Dave Perkins, Ron Fletcher"),
]

print(f'Posting Scott Borkgren to {len(entries)} events with fake HCP {FAKE_HCP} (real ~16)...')
ok = 0
for e in entries:
    result = post(e)
    status = result.get('status', result)
    print(f'  {e["event"]}: {status}')
    if result.get('status') == 'ok':
        ok += 1
    time.sleep(0.3)

print(f'\nDone. {ok}/{len(entries)} posted.')
print(f'\nScott should now appear in {ok} events with HCP {FAKE_HCP}.')
print('Run GHIN verification in the staff portal to flag the discrepancy.')
