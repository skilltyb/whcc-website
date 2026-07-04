"""
WHCC Photo Batch Uploader
Posts images directly to the Apps Script endpoint as base64.
"""
import base64, json, os, sys, time
import urllib.request, urllib.error

SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzS3VBkpJskGLhPU_2sOCQ5KCzLS0uEZd1mAucUhSipT8w78lCJE-JJ9FM-aM9NKEeP/exec'
CLAUDE_DIR = r'C:\Users\sctr1\claude'

# Build file list with categories
files = []

# Golf tournament photos
for f in ['golftournament_20250620_040.JPG','golftournament_20250620_088.JPG',
          'golftournament_20250620_097.JPG','golftournament_20250620_104.JPG',
          'golftournament_20250620_109.JPG','golftournament_20250620_112.JPG',
          'IMG_8961.JPG','IMG_9172.JPG']:
    full = os.path.join(CLAUDE_DIR, f)
    if os.path.exists(full):
        files.append((full, 'Golf', f))

# Clubhouse / social Facebook-named photos
for f in sorted(os.listdir(CLAUDE_DIR)):
    if f.lower().endswith('_n.jpg'):
        files.append((os.path.join(CLAUDE_DIR, f), 'Clubhouse', f))

print(f'Uploading {len(files)} photos...\n')

ok_count = 0
err_count = 0

for i, (path, category, name) in enumerate(files, 1):
    try:
        with open(path, 'rb') as fh:
            raw = fh.read()
        b64 = base64.b64encode(raw).decode('ascii')
        payload = json.dumps({
            'action':   'upload-photo',
            'category': category,
            'base64':   b64,
            'mimeType': 'image/jpeg',
            'filename': name
        }).encode('utf-8')

        req = urllib.request.Request(
            SCRIPT_URL,
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        # Follow redirect manually (Apps Script 302s to googleusercontent)
        opener = urllib.request.build_opener(urllib.request.HTTPRedirectHandler())
        with opener.open(req, timeout=30) as resp:
            body = resp.read().decode('utf-8')
            result = json.loads(body)

        if result.get('ok'):
            ok_count += 1
            print(f'[{i}/{len(files)}] OK  {category}/{name}')
        else:
            err_count += 1
            print(f'[{i}/{len(files)}] ERR {name}: {result}')

    except Exception as e:
        err_count += 1
        print(f'[{i}/{len(files)}] EXC {name}: {e}')

    # Small delay to avoid hammering the Apps Script quota
    time.sleep(0.5)

print(f'\nDone. {ok_count} uploaded, {err_count} errors.')
