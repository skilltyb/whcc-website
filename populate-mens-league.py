import urllib.request
import json
import time
import random
import hashlib

URL = 'https://script.google.com/macros/s/AKfycbyWRVoY7tgV1Y8M7K1Bbrhp2DsQ8CfvYYe0trVh_tCZfQ6dIsAN8Xj63b1HPvsrxaaF/exec'

def post(data):
    body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(URL, data=body, headers={'Content-Type': 'text/plain'}, method='POST')
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return json.loads(resp.read().decode())
    except Exception as ex:
        return {'error': str(ex)}

def player_hcp(first, last):
    seed = int(hashlib.md5(f'{first}{last}'.lower().encode()).hexdigest()[:8], 16)
    rng = random.Random(seed)
    r = rng.random()
    if r < 0.12:   return round(rng.uniform(0,  5),  1)
    elif r < 0.35: return round(rng.uniform(5,  12), 1)
    elif r < 0.68: return round(rng.uniform(12, 20), 1)
    elif r < 0.88: return round(rng.uniform(20, 28), 1)
    else:          return round(rng.uniform(28, 36), 1)

def rand_phone():
    area = random.choice(['573', '417'])
    return f'({area}) {random.randint(200,999)}-{random.randint(1000,9999)}'

def rand_email(first, last):
    domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
    sep = random.choice(['.', '_', ''])
    return f'{first.lower()}{sep}{last.lower()}@{random.choice(domains)}'

# ── ROSTER ────────────────────────────────────────────────────────────────────
# 15 regulars (show up ~12-15 out of 16 weeks)
REGULARS = [
    ('Gary',  'Hutchinson'),  # hcp: ~16
    ('Mike',  'Calloway'),    # hcp: ~8
    ('Dave',  'Perkins'),
    ('Ron',   'Fletcher'),
    ('Steve', 'Barnett'),
    ('Tom',   'Wiley'),
    ('Chad',  'Rivers'),
    ('Paul',  'Sievers'),
    ('Scott', 'Henderson'),
    ('Bill',  'Norris'),
    ('Alan',  'Webb'),
    ('Mark',  'Coffey'),
    ('Joe',   'Randall'),
    ('Phil',  'Stanton'),
    ('Wade',  'Greer'),
]

# 13 occasionals (show up ~4-8 out of 16 weeks)
OCCASIONALS = [
    ('Doug',  'Merritt'),
    ('Carl',  'Yates'),
    ('Brett', 'Simmons'),
    ('Jeff',  'Keller'),
    ('Dan',   'Hartley'),
    ('Greg',  'Fowler'),
    ('Ted',   'Malone'),
    ('Rob',   'Ingram'),
    ('Chris', 'Vann'),
    ('Hank',  'Morrison'),
    ('Rick',  'Langley'),
    ('Vince', 'Caldwell'),
    ('Art',   'Reeves'),
]

# ── WEEKS ────────────────────────────────────────────────────────────────────
WEEKS = [
    ("Men's League — May 9",  "May 9 · 5:00 PM"),
    ("Men's League — May 16", "May 16 · 5:00 PM"),
    ("Men's League — May 23", "May 23 · 5:00 PM"),
    ("Men's League — May 30", "May 30 · 5:00 PM"),
    ("Men's League — Jun 6",  "Jun 6 · 5:00 PM"),
    ("Men's League — Jun 13", "Jun 13 · 5:00 PM"),
    ("Men's League — Jun 20", "Jun 20 · 5:00 PM"),
    ("Men's League — Jun 27", "Jun 27 · 5:00 PM"),
    ("Men's League — Jul 4",  "Jul 4 · 5:00 PM"),
    ("Men's League — Jul 11", "Jul 11 · 5:00 PM"),
    ("Men's League — Jul 18", "Jul 18 · 5:00 PM"),
    ("Men's League — Jul 25", "Jul 25 · 5:00 PM"),
    ("Men's League — Aug 1",  "Aug 1 · 5:00 PM"),
    ("Men's League — Aug 8",  "Aug 8 · 5:00 PM"),
    ("Men's League — Aug 15", "Aug 15 · 5:00 PM"),
    ("Men's League — Aug 22", "Aug 22 · 5:00 PM"),
]

# ── BUILD WEEKLY LINEUPS ──────────────────────────────────────────────────────
# Use a seeded approach so the same player doesn't always pair with the same people.
# We generate attendance per week, then the groups builder handles fair pairing by HCP.
random.seed(42)

def build_lineup(week_idx):
    """Pick 14–20 players for a given week with realistic rotation."""
    attendees = []

    # Regulars: ~87% attendance rate (skip ~2/16 weeks each)
    for p in REGULARS:
        # Use the week index and player name to deterministically vary attendance
        # while still feeling random
        rng_val = random.random()
        if rng_val < 0.87:
            attendees.append(p)

    # Occasionals: ~44% attendance rate (~7/16 weeks each)
    for p in OCCASIONALS:
        if random.random() < 0.44:
            attendees.append(p)

    # Enforce 14–20 range
    random.shuffle(attendees)
    if len(attendees) < 14:
        # Pull from missing players to fill up
        missing = [p for p in REGULARS + OCCASIONALS if p not in attendees]
        random.shuffle(missing)
        attendees += missing[:14 - len(attendees)]
    elif len(attendees) > 20:
        attendees = attendees[:20]

    return attendees

total = 0
for week_idx, (event, meta) in enumerate(WEEKS):
    lineup = build_lineup(week_idx)
    print(f'\n{event} — {len(lineup)} players')

    for first, last in lineup:
        hcp = player_hcp(first, last)
        reg = {
            'id':        f'ML{week_idx+1:02d}-{first[:3]}{last[:3]}-{random.randint(1000,9999)}',
            'event':     event,
            'eventMeta': meta,
            'firstName': first,
            'lastName':  last,
            'email':     rand_email(first, last),
            'phone':     rand_phone() if random.random() > 0.2 else '',
            'partner':   '',
            'players':   '1',
            'memberNum': str(random.randint(101, 450)),
            'ghin':      hcp,
            'notes':     '',
            'timestamp': f'2026-{4+week_idx//4:02d}-{1+week_idx%4*7:02d}T18:00:00.000Z',
            'source':    'website',
        }
        result = post(reg)
        if 'error' in result:
            print(f'  FAIL {first} {last} ({hcp}) -- {result["error"]}')
        else:
            print(f'  OK {first} {last} (HCP {hcp})')
        time.sleep(0.3)

    total += len(lineup)
    time.sleep(0.5)

print(f'\n\nDone. {total} total registrations across {len(WEEKS)} weeks.')
