import urllib.request
import json
import random
import time

URL = 'https://script.google.com/macros/s/AKfycbxLIwXQMtgijncf-a6nnP4EsCliKGEM-yTsfja9hYFzLueQujBhevo-n8ICUHFRAEp1/exec'

def post(data):
    body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(URL, data=body, headers={'Content-Type': 'text/plain'}, method='POST')
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return json.loads(resp.read().decode())
    except Exception as ex:
        return {'error': str(ex)}

# 5 couples for the Couples Scramble
# Each entry: (firstName, lastName, partnerFullName, primaryHcp, partnerHcp)
couples = [
    ('Bob',   'Johnson',  'Mary Johnson',   10, 20),
    ('Tom',   'Davis',    'Linda Davis',     6, 16),
    ('Steve', 'Wilson',   'Karen Wilson',   14, 24),
    ('Mike',  'Anderson', 'Susan Anderson',  8, 18),
    ('Jim',   'Martinez', 'Carol Martinez', 12, 22),
]

print('Posting 5 couples entries for Couples Scramble...')
for first, last, partner, hcp, partner_hcp in couples:
    reg = {
        'id': f'CouplesS-{first[:3]}{last[:3]}-{random.randint(1000,9999)}',
        'event': 'Couples Scramble',
        'eventMeta': 'Jun 14 · 9:00 AM - 1:00 PM',
        'firstName': first,
        'lastName':  last,
        'email':     f'{first.lower()}.{last.lower()}@gmail.com',
        'phone':     f'(573) {random.randint(200,999)}-{random.randint(1000,9999)}',
        'partner':   partner,
        'players':   '2',
        'memberNum': str(random.randint(101, 450)),
        'ghin':      str(hcp),
        'partnerGhin': str(partner_hcp),
        'notes':     '',
        'timestamp': '2026-03-21T10:00:00.000Z',
        'source':    'website'
    }
    result = post(reg)
    status = result.get('status', result)
    print(f'  {first} {last} & {partner} (HCP {hcp}/{partner_hcp}): {status}')
    time.sleep(0.4)

print('\nDone.')
