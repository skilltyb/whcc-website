import urllib.request
import json
import time
import random
import hashlib
from datetime import datetime, timedelta

URL = 'https://script.google.com/macros/s/AKfycbxLIwXQMtgijncf-a6nnP4EsCliKGEM-yTsfja9hYFzLueQujBhevo-n8ICUHFRAEp1/exec'

def post(data):
    body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(URL, data=body, headers={'Content-Type': 'text/plain'}, method='POST')
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return json.loads(resp.read().decode())
    except Exception as ex:
        return {'error': str(ex)}

def rand_timestamp(month=4):
    base = datetime(2026, month, 1)
    delta = timedelta(days=random.randint(0, 25), hours=random.randint(7, 21), minutes=random.randint(0, 59))
    return (base + delta).strftime('%Y-%m-%dT%H:%M:%S.000Z')

def rand_phone():
    area = random.choice(['573', '417', '314'])
    return f'({area}) {random.randint(200,999)}-{random.randint(1000,9999)}'

def rand_email(first, last):
    domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com']
    sep = random.choice(['.', '_', ''])
    return f'{first.lower()}{sep}{last.lower()}@{random.choice(domains)}'

def player_hcp(first, last):
    """Consistent, realistic golf handicap index (0–36) seeded by player name."""
    seed = int(hashlib.md5(f'{first}{last}'.lower().encode()).hexdigest()[:8], 16)
    rng = random.Random(seed)
    r = rng.random()
    if r < 0.12:   return round(rng.uniform(0,  5),  1)   # scratch / low
    elif r < 0.35: return round(rng.uniform(5,  12), 1)   # competitive
    elif r < 0.68: return round(rng.uniform(12, 20), 1)   # mid
    elif r < 0.88: return round(rng.uniform(20, 28), 1)   # high
    else:          return round(rng.uniform(28, 36), 1)   # very high

def rand_note():
    notes = ['', '', '', '', 'Cart needed', 'Prefer early tee time', 'Vegetarian',
             'Celebrating anniversary', 'Bring guest cart', '', '', '', 'Need locker']
    return random.choice(notes)

def make_reg(event, meta, first, last, partner='', players='1'):
    return {
        'id': f'{event[:8].replace(" ","")}-{first[:3]}{last[:3]}-{random.randint(1000,9999)}',
        'event':     event,
        'eventMeta': meta,
        'firstName': first,
        'lastName':  last,
        'email':     rand_email(first, last),
        'phone':     rand_phone() if random.random() > 0.12 else '',
        'partner':   partner,
        'players':   players,
        'memberNum': str(random.randint(101, 450)),
        'ghin':      player_hcp(first, last),
        'notes':     rand_note(),
        'timestamp': rand_timestamp(),
        'source':    'website'
    }

regs = []

# ── SPRING 2-MAN SCRAMBLE  cap=40  target=14 twosomes (35%) ──────────────────
spring2man = [
    ('Gary','Hutchinson','Mike Calloway'),    ('Dave','Perkins','Ron Fletcher'),
    ('Steve','Barnett','Tom Wiley'),           ('Jim','Pearce','Larry Odom'),
    ('Chad','Rivers','Paul Sievers'),          ('Kenny','Boone','Frank DeLuca'),
    ('Scott','Henderson','Ray Tatum'),         ('Bill','Norris','Curt Lawson'),
    ('Alan','Webb','Drew Hines'),              ('Mark','Coffey','Joe Randall'),
    ('Phil','Stanton','Wade Greer'),           ('Doug','Merritt','Carl Yates'),
    ('Brett','Simmons','Jeff Keller'),         ('Dan','Hartley','Greg Fowler'),
]
for f,l,p in spring2man:
    regs.append(make_reg('Spring 2-Man Scramble', 'Apr 12 · 9:00 AM – 2:00 PM', f, l, p, '2'))

# ── LADIES SWEET TREAT  cap=12  target=4 foursomes (33%) ─────────────────────
sweet_treat = [
    ('Susan','Hutchinson','Carol Perkins, Diane Fletcher, Patty Calloway'),
    ('Lynn','Barnett','Judy Wiley, Barbara Pearce, Nancy Odom'),
    ('Cheryl','Rivers','Kim Sievers, Debbie Boone, Linda DeLuca'),
    ('Mary','Henderson','Paula Tatum, Donna Norris, Brenda Lawson'),
]
for f,l,p in sweet_treat:
    regs.append(make_reg('Ladies Sweet Treat', 'Apr 14 · 11:00 AM – 3:00 PM', f, l, p, '4'))

# ── MASTERS DINNER  cap=80  target=28 singles (35%) ──────────────────────────
masters = [
    ('Gary','Hutchinson'),   ('Mike','Calloway'),    ('Dave','Perkins'),    ('Ron','Fletcher'),
    ('Steve','Barnett'),     ('Tom','Wiley'),         ('Jim','Pearce'),      ('Larry','Odom'),
    ('Chad','Rivers'),       ('Paul','Sievers'),      ('Kenny','Boone'),     ('Frank','DeLuca'),
    ('Scott','Henderson'),   ('Ray','Tatum'),         ('Bill','Norris'),     ('Curt','Lawson'),
    ('Alan','Webb'),         ('Drew','Hines'),         ('Mark','Coffey'),     ('Joe','Randall'),
    ('Phil','Stanton'),      ('Wade','Greer'),         ('Doug','Merritt'),    ('Carl','Yates'),
    ('Brett','Simmons'),     ('Jeff','Keller'),        ('Dan','Hartley'),     ('Greg','Fowler'),
]
for f,l in masters:
    regs.append(make_reg('Masters Dinner', 'Apr 8 · 6:30 – 9:30 PM', f, l))

# ── COUPLES SCRAMBLE  cap=32  target=12 twosomes (37%) ───────────────────────
couples = [
    ('Gary','Hutchinson','Susan Hutchinson'),    ('Dave','Perkins','Carol Perkins'),
    ('Steve','Barnett','Lynn Barnett'),           ('Jim','Pearce','Barbara Pearce'),
    ('Chad','Rivers','Cheryl Rivers'),            ('Kenny','Boone','Debbie Boone'),
    ('Scott','Henderson','Mary Henderson'),       ('Bill','Norris','Donna Norris'),
    ('Alan','Webb','Gail Webb'),                  ('Mark','Coffey','Rose Coffey'),
    ('Phil','Stanton','Janet Stanton'),           ('Doug','Merritt','Ellen Merritt'),
]
for f,l,p in couples:
    regs.append(make_reg('Couples Scramble', 'Jun 6 · 9:00 AM – 2:00 PM', f, l, p, '2'))

# ── LADIES INVITATIONAL  cap=48  target=16 singles (33%) ─────────────────────
ladies_inv = [
    ('Susan','Hutchinson'),  ('Carol','Perkins'),   ('Diane','Fletcher'),  ('Patty','Calloway'),
    ('Lynn','Barnett'),      ('Judy','Wiley'),       ('Barbara','Pearce'),  ('Nancy','Odom'),
    ('Cheryl','Rivers'),     ('Kim','Sievers'),      ('Debbie','Boone'),    ('Linda','DeLuca'),
    ('Mary','Henderson'),    ('Paula','Tatum'),       ('Donna','Norris'),    ('Brenda','Lawson'),
]
for f,l in ladies_inv:
    regs.append(make_reg('Ladies Invitational', 'Jun 13 · 9:00 AM – 2:00 PM', f, l))

# ── MULES INVITATIONAL  cap=20  target=5 foursomes (25%) ─────────────────────
mules = [
    ('Gary','Hutchinson','Mike Calloway, Dave Perkins, Ron Fletcher'),
    ('Steve','Barnett','Tom Wiley, Jim Pearce, Larry Odom'),
    ('Chad','Rivers','Paul Sievers, Kenny Boone, Frank DeLuca'),
    ('Scott','Henderson','Ray Tatum, Bill Norris, Curt Lawson'),
    ('Alan','Webb','Drew Hines, Mark Coffey, Joe Randall'),
]
for f,l,p in mules:
    regs.append(make_reg('Mules Invitational', 'Apr 13 · 9:00 AM – 2:00 PM', f, l, p, '4'))

# ── MGA DRAFT DAY  cap=72  target=22 singles (30%) ───────────────────────────
mga = [
    ('Gary','Hutchinson'),  ('Mike','Calloway'),   ('Dave','Perkins'),    ('Ron','Fletcher'),
    ('Steve','Barnett'),    ('Tom','Wiley'),        ('Jim','Pearce'),      ('Larry','Odom'),
    ('Chad','Rivers'),      ('Paul','Sievers'),     ('Kenny','Boone'),     ('Frank','DeLuca'),
    ('Scott','Henderson'),  ('Ray','Tatum'),        ('Bill','Norris'),     ('Curt','Lawson'),
    ('Alan','Webb'),        ('Drew','Hines'),        ('Mark','Coffey'),     ('Joe','Randall'),
    ('Phil','Stanton'),     ('Wade','Greer'),
]
for f,l in mga:
    regs.append(make_reg('MGA Draft Day', 'Apr 17 · 6:00 – 10:00 PM', f, l))

# ── 4TH OF JULY SCRAMBLE  cap=40  target=16 twosomes (40%) ───────────────────
july4 = [
    ('Gary','Hutchinson','Mike Calloway'),   ('Dave','Perkins','Ron Fletcher'),
    ('Steve','Barnett','Tom Wiley'),          ('Jim','Pearce','Larry Odom'),
    ('Chad','Rivers','Paul Sievers'),         ('Kenny','Boone','Frank DeLuca'),
    ('Scott','Henderson','Ray Tatum'),        ('Bill','Norris','Curt Lawson'),
    ('Alan','Webb','Drew Hines'),             ('Mark','Coffey','Joe Randall'),
    ('Phil','Stanton','Wade Greer'),          ('Doug','Merritt','Carl Yates'),
    ('Brett','Simmons','Jeff Keller'),        ('Dan','Hartley','Greg Fowler'),
    ('Ted','Malone','Rob Ingram'),            ('Chris','Vann','Pete Aldridge'),
]
for f,l,p in july4:
    regs.append(make_reg('4th of July Scramble', 'Jul 4 · 8:00 AM – 1:00 PM', f, l, p, '2'))

# ── MEMBER-GUEST  cap=60  target=22 twosomes (37%) ───────────────────────────
memguest = [
    ('Gary','Hutchinson','Brian Hutchinson'),     ('Dave','Perkins','Kyle Perkins'),
    ('Steve','Barnett','Todd Barnett'),            ('Jim','Pearce','Matt Pearce'),
    ('Chad','Rivers','Cole Rivers'),               ('Kenny','Boone','Tyler Boone'),
    ('Scott','Henderson','Jake Henderson'),        ('Bill','Norris','Ryan Norris'),
    ('Alan','Webb','Evan Webb'),                   ('Mark','Coffey','Grant Coffey'),
    ('Phil','Stanton','Derek Stanton'),            ('Doug','Merritt','Wes Merritt'),
    ('Brett','Simmons','Troy Simmons'),            ('Dan','Hartley','Eric Hartley'),
    ('Ted','Malone','Ben Malone'),                 ('Chris','Vann','Jordan Vann'),
    ('Hank','Morrison','Austin Morrison'),         ('Vince','Caldwell','Luke Caldwell'),
    ('Murray','Talbot','Noah Talbot'),             ('Earl','Patterson','Eli Patterson'),
    ('Floyd','Kemp','Connor Kemp'),                ('Walt','Bridges','Seth Bridges'),
]
for f,l,p in memguest:
    regs.append(make_reg('Member-Guest', 'Jul 18–19 · 2-Day Tournament', f, l, p, '2'))

# ── CLUB CHAMPIONSHIP  cap=64  target=26 singles (41%) ───────────────────────
club_champ = [
    ('Gary','Hutchinson'),  ('Mike','Calloway'),   ('Dave','Perkins'),    ('Ron','Fletcher'),
    ('Steve','Barnett'),    ('Tom','Wiley'),        ('Jim','Pearce'),      ('Larry','Odom'),
    ('Chad','Rivers'),      ('Paul','Sievers'),     ('Kenny','Boone'),     ('Frank','DeLuca'),
    ('Scott','Henderson'),  ('Ray','Tatum'),        ('Bill','Norris'),     ('Curt','Lawson'),
    ('Alan','Webb'),        ('Drew','Hines'),        ('Mark','Coffey'),     ('Joe','Randall'),
    ('Phil','Stanton'),     ('Wade','Greer'),        ('Doug','Merritt'),    ('Carl','Yates'),
    ('Brett','Simmons'),    ('Jeff','Keller'),
]
for f,l in club_champ:
    regs.append(make_reg('Club Championship', 'Aug 1–2 · Club Tournament', f, l))

# ── LADIES CLUB CHAMPIONSHIP  cap=32  target=12 singles (37%) ────────────────
ladies_champ = [
    ('Susan','Hutchinson'),  ('Carol','Perkins'),   ('Diane','Fletcher'),  ('Patty','Calloway'),
    ('Lynn','Barnett'),      ('Judy','Wiley'),       ('Barbara','Pearce'),  ('Nancy','Odom'),
    ('Cheryl','Rivers'),     ('Kim','Sievers'),      ('Debbie','Boone'),    ('Linda','DeLuca'),
]
for f,l in ladies_champ:
    regs.append(make_reg('Ladies Club Championship', 'Aug 8–9 · Club Tournament', f, l))

# ── FALL 2-MAN SCRAMBLE  cap=40  target=14 twosomes (35%) ────────────────────
fall2man = [
    ('Gary','Hutchinson','Mike Calloway'),   ('Dave','Perkins','Ron Fletcher'),
    ('Steve','Barnett','Tom Wiley'),          ('Jim','Pearce','Larry Odom'),
    ('Chad','Rivers','Paul Sievers'),         ('Kenny','Boone','Frank DeLuca'),
    ('Scott','Henderson','Ray Tatum'),        ('Bill','Norris','Curt Lawson'),
    ('Alan','Webb','Drew Hines'),             ('Mark','Coffey','Joe Randall'),
    ('Phil','Stanton','Wade Greer'),          ('Doug','Merritt','Carl Yates'),
    ('Brett','Simmons','Jeff Keller'),        ('Dan','Hartley','Greg Fowler'),
]
for f,l,p in fall2man:
    regs.append(make_reg('Fall 2-Man Scramble', 'Sep 12 · 9:00 AM – 2:00 PM', f, l, p, '2'))

# ── SENIOR SCRAMBLE  cap=24  target=8 twosomes (33%) ─────────────────────────
senior = [
    ('Gary','Hutchinson','Mike Calloway'),   ('Dave','Perkins','Ron Fletcher'),
    ('Steve','Barnett','Tom Wiley'),          ('Jim','Pearce','Larry Odom'),
    ('Chad','Rivers','Paul Sievers'),         ('Kenny','Boone','Frank DeLuca'),
    ('Scott','Henderson','Ray Tatum'),        ('Bill','Norris','Curt Lawson'),
]
for f,l,p in senior:
    regs.append(make_reg('Senior Scramble', 'Sep 26 · 9:00 AM – 1:00 PM', f, l, p, '2'))

# ── CLOSING DAY SCRAMBLE  cap=16  target=5 foursomes (31%) ───────────────────
closing = [
    ('Gary','Hutchinson','Mike Calloway, Dave Perkins, Ron Fletcher'),
    ('Steve','Barnett','Tom Wiley, Jim Pearce, Larry Odom'),
    ('Chad','Rivers','Paul Sievers, Kenny Boone, Frank DeLuca'),
    ('Scott','Henderson','Ray Tatum, Bill Norris, Curt Lawson'),
    ('Alan','Webb','Drew Hines, Mark Coffey, Joe Randall'),
]
for f,l,p in closing:
    regs.append(make_reg('Closing Day Scramble', 'Oct 10 · 9:00 AM – 2:00 PM', f, l, p, '4'))

# ── HALLOWEEN COSTUME SCRAMBLE  cap=32  target=12 twosomes (37%) ─────────────
halloween = [
    ('Gary','Hutchinson','Mike Calloway'),   ('Dave','Perkins','Ron Fletcher'),
    ('Steve','Barnett','Tom Wiley'),          ('Jim','Pearce','Larry Odom'),
    ('Chad','Rivers','Paul Sievers'),         ('Kenny','Boone','Frank DeLuca'),
    ('Scott','Henderson','Ray Tatum'),        ('Bill','Norris','Curt Lawson'),
    ('Alan','Webb','Drew Hines'),             ('Mark','Coffey','Joe Randall'),
    ('Phil','Stanton','Wade Greer'),          ('Doug','Merritt','Carl Yates'),
]
for f,l,p in halloween:
    regs.append(make_reg('Halloween Costume Scramble', 'Oct 31 · 10:00 AM – 3:00 PM', f, l, p, '2'))


# ── POST ALL ──────────────────────────────────────────────────────────────────
print(f'Posting {len(regs)} registrations across 15 events...\n')
success = 0
failed  = []

for i, reg in enumerate(regs):
    result = post(reg)
    if result.get('status') == 'ok':
        success += 1
    else:
        print(f'  FAILED: {reg["firstName"]} {reg["lastName"]} ({reg["event"]}) — {result}')
        failed.append(reg)
    if (i+1) % 15 == 0:
        print(f'  {i+1}/{len(regs)} posted...')
    time.sleep(0.25)

print(f'\nDone!  {success}/{len(regs)} posted successfully.')
if failed:
    print(f'{len(failed)} failed.')

# Summary with fill %
event_caps = {
    'Spring 2-Man Scramble': 40,  'Ladies Sweet Treat': 12,    'Masters Dinner': 80,
    'Couples Scramble': 32,        'Ladies Invitational': 48,   'Mules Invitational': 20,
    'MGA Draft Day': 72,           '4th of July Scramble': 40,  'Member-Guest': 60,
    'Club Championship': 64,       'Ladies Club Championship': 32, 'Fall 2-Man Scramble': 40,
    'Senior Scramble': 24,         'Closing Day Scramble': 16,  'Halloween Costume Scramble': 32,
}
counts = {}
for r in regs:
    counts[r['event']] = counts.get(r['event'], 0) + 1

print('\nRegistrations posted this run:')
print(f'  {"Event":<32} {"Reg":>4}  {"Cap":>4}  {"Fill":>5}')
print(f'  {"-"*32}  {"-"*4}  {"-"*4}  {"-"*5}')
for ev, cnt in counts.items():
    cap = event_caps.get(ev, '?')
    pct = f'{cnt/cap*100:.0f}%' if isinstance(cap, int) else '?'
    print(f'  {ev:<32} {cnt:>4}  {cap:>4}  {pct:>5}')
