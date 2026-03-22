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
        result = json.loads(resp.read().decode())
        return result
    except Exception as ex:
        return {'error': str(ex)}

def rand_timestamp():
    base = datetime(2026, 3, 1)
    delta = timedelta(days=random.randint(0, 19), hours=random.randint(7, 21), minutes=random.randint(0, 59))
    return (base + delta).strftime('%Y-%m-%dT%H:%M:%S.000Z')

def rand_phone():
    area = random.choice(['573', '417'])
    return f'({area}) {random.randint(200,999)}-{random.randint(1000,9999)}'

def rand_email(first, last):
    domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
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
    notes = ['', '', '', '', '', 'Cart needed', 'Prefer early tee time', 'Vegetarian', 'Celebrating birthday', 'First time playing', '', '', '']
    return random.choice(notes)

def make_reg(event, meta, first, last, partner='', players='1', is_team=False):
    mem_num = str(random.randint(101, 450))
    return {
        'id': f'{event[:8].replace(" ","")}-{first[:3]}{last[:3]}-{random.randint(1000,9999)}',
        'event': event,
        'eventMeta': meta,
        'firstName': first,
        'lastName': last,
        'email': rand_email(first, last),
        'phone': rand_phone() if random.random() > 0.15 else '',
        'partner': partner,
        'players': players,
        'memberNum': mem_num,
        'ghin': player_hcp(first, last),
        'notes': rand_note(),
        'timestamp': rand_timestamp(),
        'source': 'website'
    }

# Step 1: Clear test entries
print('Clearing test entries...')
result = post({'action': 'clear-test'})
print(f'  {result}')
time.sleep(1)

registrations = []

# ST PATTY'S SHOOTOUT (22)
singles_1 = [
    ('Gary','Hutchinson'),('Mike','Calloway'),('Dave','Perkins'),('Ron','Fletcher'),
    ('Steve','Barnett'),('Tom','Wiley'),('Jim','Pearce'),('Larry','Odom'),
    ('Chad','Rivers'),('Paul','Sievers'),('Kenny','Boone'),('Frank','DeLuca'),
    ('Scott','Henderson'),('Ray','Tatum'),('Bill','Norris'),('Curt','Lawson'),
    ('Alan','Webb'),('Drew','Hines'),('Mark','Coffey'),('Joe','Randall'),
    ('Phil','Stanton'),('Wade','Greer')
]
for f,l in singles_1:
    registrations.append(make_reg("St. Patty's Shootout", "Mar 14 · 10:30 AM – 2:30 PM", f, l))

# LADIES OPENING DAY (18)
ladies_1 = [
    ('Susan','Hutchinson'),('Carol','Perkins'),('Diane','Fletcher'),('Patty','Calloway'),
    ('Lynn','Barnett'),('Judy','Wiley'),('Barbara','Pearce'),('Nancy','Odom'),
    ('Cheryl','Rivers'),('Kim','Sievers'),('Debbie','Boone'),('Linda','DeLuca'),
    ('Mary','Henderson'),('Paula','Tatum'),('Donna','Norris'),('Brenda','Lawson'),
    ('Gail','Webb'),('Faye','Hines')
]
for f,l in ladies_1:
    registrations.append(make_reg("Ladies Opening Day", "Apr 7 · 9:00 AM – 1:00 PM", f, l))

# MEN'S GOLF MASTER DINNER (31)
masters = singles_1 + [
    ('Doug','Merritt'),('Carl','Yates'),('Brett','Simmons'),('Jeff','Keller'),
    ('Dan','Hartley'),('Greg','Fowler'),('Ted','Malone'),('Rob','Ingram'),
    ('Chris','Vann')
]
for f,l in masters:
    registrations.append(make_reg("Masters Dinner", "Apr 8 · 6:30 – 9:30 PM", f, l))

# POPLAR BLUFF MULES INVITATIONAL (12 foursomes)
mules_teams = [
    ('Gary','Hutchinson','Mike Calloway, Dave Perkins, Ron Fletcher'),
    ('Steve','Barnett','Tom Wiley, Jim Pearce, Larry Odom'),
    ('Chad','Rivers','Paul Sievers, Kenny Boone, Frank DeLuca'),
    ('Scott','Henderson','Ray Tatum, Bill Norris, Curt Lawson'),
    ('Alan','Webb','Drew Hines, Mark Coffey, Joe Randall'),
    ('Phil','Stanton','Wade Greer, Doug Merritt, Carl Yates'),
    ('Brett','Simmons','Jeff Keller, Dan Hartley, Greg Fowler'),
    ('Ted','Malone','Rob Ingram, Chris Vann, Pete Aldridge'),
    ('Hank','Morrison','Dale Curtis, Rick Langley, Sam Doyle'),
    ('Vince','Caldwell','Art Reeves, Bud Strickland, Leon Church'),
    ('Murray','Talbot','Gus Hensley, Floyd Kemp, Norm Bishop'),
    ('Earl','Patterson','Cecil Crane, Homer Dunn, Rex Garland'),
]
for f,l,partners in mules_teams:
    registrations.append(make_reg("Mules Invitational", "Apr 13 · 9:00 AM – 2:00 PM", f, l, partners, '4', True))

# MGA OPENING DAY DRAFT (40)
mga_names = singles_1 + [('Doug','Merritt'),('Carl','Yates'),('Brett','Simmons'),('Jeff','Keller'),
    ('Dan','Hartley'),('Greg','Fowler'),('Ted','Malone'),('Rob','Ingram'),
    ('Chris','Vann'),('Pete','Aldridge'),('Hank','Morrison'),('Dale','Curtis'),
    ('Rick','Langley'),('Sam','Doyle'),('Vince','Caldwell'),('Art','Reeves'),
    ('Bud','Strickland'),('Leon','Church')]
for f,l in mga_names[:40]:
    registrations.append(make_reg("MGA Draft Day", "Apr 17 · 6:00 – 10:00 PM", f, l))

# MEN'S OPENING DAY (55)
opening_day = singles_1 + [('Doug','Merritt'),('Carl','Yates'),('Brett','Simmons'),('Jeff','Keller'),
    ('Dan','Hartley'),('Greg','Fowler'),('Ted','Malone'),('Rob','Ingram'),
    ('Chris','Vann'),('Pete','Aldridge'),('Hank','Morrison'),('Dale','Curtis'),
    ('Rick','Langley'),('Sam','Doyle'),('Vince','Caldwell'),('Art','Reeves'),
    ('Bud','Strickland'),('Leon','Church'),('Murray','Talbot'),('Gus','Hensley'),
    ('Floyd','Kemp'),('Norm','Bishop'),('Earl','Patterson'),('Cecil','Crane'),
    ('Homer','Dunn'),('Rex','Garland'),('Walt','Bridges'),('Clint','Farley'),
    ('Boyd','Ramsey'),('Luther','Paine'),('Grady','Holt'),('Vernon','Cross'),('Chester','Quinn')]
for f,l in opening_day[:55]:
    registrations.append(make_reg("Men's Opening Day", "Apr 18 · 9:30 AM – 2:00 PM", f, l))

# OZARK INVITATIONAL (32 twosomes)
ozark_teams = [
    ('Gary','Hutchinson','Mike Calloway'),('Dave','Perkins','Ron Fletcher'),
    ('Steve','Barnett','Tom Wiley'),('Jim','Pearce','Larry Odom'),
    ('Chad','Rivers','Paul Sievers'),('Kenny','Boone','Frank DeLuca'),
    ('Scott','Henderson','Ray Tatum'),('Bill','Norris','Curt Lawson'),
    ('Alan','Webb','Drew Hines'),('Mark','Coffey','Joe Randall'),
    ('Phil','Stanton','Wade Greer'),('Doug','Merritt','Carl Yates'),
    ('Brett','Simmons','Jeff Keller'),('Dan','Hartley','Greg Fowler'),
    ('Ted','Malone','Rob Ingram'),('Chris','Vann','Pete Aldridge'),
    ('Hank','Morrison','Dale Curtis'),('Rick','Langley','Sam Doyle'),
    ('Vince','Caldwell','Art Reeves'),('Bud','Strickland','Leon Church'),
    ('Murray','Talbot','Gus Hensley'),('Floyd','Kemp','Norm Bishop'),
    ('Earl','Patterson','Cecil Crane'),('Homer','Dunn','Rex Garland'),
    ('Walt','Bridges','Clint Farley'),('Boyd','Ramsey','Luther Paine'),
    ('Grady','Holt','Vernon Cross'),('Chester','Quinn','Rufus Sparks'),
    ('Lester','Byrd','Alvin Sharp'),('Ernest','Cobb','Jasper Lane'),
    ('Orville','Marsh','Harley Stone'),('Calvin','Reed','Willis Burke'),
]
for f,l,partner in ozark_teams:
    registrations.append(make_reg("Ozark Invitational", "Apr 25–26 · 2-Day Tournament", f, l, partner, '2', True))

# POST all registrations
print(f'Posting {len(registrations)} registrations...')
success = 0
failed = []
for i, reg in enumerate(registrations):
    result = post(reg)
    if result.get('status') == 'ok':
        success += 1
    else:
        print(f'  FAILED: {reg["firstName"]} {reg["lastName"]} ({reg["event"]}) — {result}')
        failed.append(reg)
    if (i+1) % 10 == 0:
        print(f'  {i+1}/{len(registrations)} posted...')
    time.sleep(0.3)

print(f'\nDone! {success}/{len(registrations)} registrations posted successfully.')
if failed:
    print(f'{len(failed)} failed entries.')

# Event summary
event_counts = {}
for reg in registrations:
    e = reg['event']
    event_counts[e] = event_counts.get(e, 0) + 1

print('\nRegistrations by event:')
for ev, count in event_counts.items():
    print(f'  {ev}: {count}')
