#!/usr/bin/env python3
"""Run by the GitHub Pages deploy workflow (never needs to be run by hand).

1. Route pages. The site is one page (index.html) with real-looking addresses
   such as /golf and /events. GitHub Pages answers those with a "404" status,
   which keeps Google from indexing them and shows the wrong preview when a
   link is shared. This writes golf.html, events.html, ... so each address is a
   real page, with its own title, description and share preview.
2. Old Wix addresses. Writes small redirect pages so links and search results
   pointing at the previous website land on the matching page here.

Usage: python3 build-routes.py [site-folder]
"""
import html
import os
import re
import sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
ORIGIN = 'https://westwoodhillscountryclub.com'

# Old Wix address -> new page
LEGACY = {
    'go-to-calendar':             '/events',      # Calendar
    'copy-of-calendar':           '/events',      # Tournaments
    'copy-of-resturant-and-bar':  '/membership',  # Membership
    'copy-of-dining':             '/golf',        # Course
    'copy-of-pool':               '/dining',      # Dining
    'copy-of-events':             '/aquatics',    # Pool
    'copy-of-membership-perks':   '/about',       # About Us
    'copy-of-resturant-and-bar-1': '/events',     # Events & Catering
    'copy-of-resturant-and-bar-2': '/golf',       # Pro Shop
    'payment-request-page':       '/',
}

with open(os.path.join(ROOT, 'index.html'), encoding='utf-8') as f:
    src = f.read()

# Read the per-page titles/descriptions straight from the site so they never drift
meta = {}
for m in re.finditer(r"(\w+):\s*\{\s*title:\s*'((?:\\'|[^'])*)',\s*desc:\s*'((?:\\'|[^'])*)'\s*\}", src):
    meta[m.group(1)] = (m.group(2).replace("\\'", "'"), m.group(3).replace("\\'", "'"))

routes = [k for k in meta if k not in ('home', 'staff')]
if not routes:
    sys.exit('build-routes: no page metadata found in index.html')


def swap(text, pattern, replacement):
    new, n = re.subn(pattern, lambda _m: replacement, text, count=1)
    if n != 1:
        sys.exit('build-routes: could not find ' + pattern)
    return new


for route in routes:
    title, desc = meta[route]
    t, d, url = html.escape(title), html.escape(desc), ORIGIN + '/' + route
    page = src
    page = swap(page, r'<title>.*?</title>', '<title>%s</title>' % t)
    page = swap(page, r'<meta name="description" content=".*?" />', '<meta name="description" content="%s" />' % d)
    page = swap(page, r'<meta property="og:title" content=".*?" />', '<meta property="og:title" content="%s" />' % t)
    page = swap(page, r'<meta property="og:description" content=".*?" />', '<meta property="og:description" content="%s" />' % d)
    page = swap(page, r'<meta property="og:url" content=".*?" />', '<meta property="og:url" content="%s" />' % url)
    page = swap(page, r'<link rel="canonical" href=".*?" />', '<link rel="canonical" href="%s" />' % url)
    with open(os.path.join(ROOT, route + '.html'), 'w', encoding='utf-8') as out:
        out.write(page)

STUB = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Westwood Hills Country Club</title>
<link rel="canonical" href="{origin}{target}">
<meta http-equiv="refresh" content="0; url={target}">
<script>location.replace("{target}");</script>
</head>
<body>
<p>This page has moved. <a href="{target}">Continue to the Westwood Hills Country Club website</a>.</p>
</body>
</html>
'''
for slug, target in LEGACY.items():
    folder = os.path.join(ROOT, slug)
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, 'index.html'), 'w', encoding='utf-8') as out:
        out.write(STUB.format(origin=ORIGIN, target=target))

print('build-routes: %d route pages, %d redirect pages' % (len(routes), len(LEGACY)))
