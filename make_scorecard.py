from PIL import Image, ImageDraw, ImageFont
import os

F   = r'C:\Windows\Fonts'
OUT = r'C:\Users\sctr1\claude\images\scorecard.jpg'

# ── Palette ────────────────────────────────────────────────────────────────────
DARK_GREEN = (26,  43,  31)
MED_GREEN  = (38,  62,  44)
GOLD       = (196, 160,  80)
GOLD_LIGHT = (220, 190, 110)
CREAM      = (252, 248, 240)
WHITE      = (255, 255, 255)
LIGHT_ROW  = (245, 248, 245)
ALT_ROW    = (235, 243, 236)
TOTAL_ROW  = (210, 230, 212)
RULE_LINE  = (200, 215, 202)
BLACK_TEE  = ( 30,  30,  30)
BLUE_TEE   = ( 35, 110, 185)
WHITE_TEE  = (100, 100, 100)
RED_TEE    = (195,  50,  50)
TEXT_DARK  = ( 20,  20,  20)
TEXT_MID   = ( 80,  80,  80)

def fnt(name, size):
    return ImageFont.truetype(os.path.join(F, name), size)

f_title  = fnt('georgiab.ttf', 54)
f_sub    = fnt('georgia.ttf',  26)
f_tag    = fnt('georgia.ttf',  19)
f_th     = fnt('arialbd.ttf',  17)
f_td     = fnt('arial.ttf',    18)
f_td_b   = fnt('arialbd.ttf',  18)
f_rating = fnt('arialbd.ttf',  14)
f_small  = fnt('arial.ttf',    15)
f_rule   = fnt('arial.ttf',    16)
f_rule_b = fnt('arialbd.ttf',  16)
f_staff  = fnt('georgia.ttf',  17)
f_staff_t= fnt('arial.ttf',    14)
f_sec    = fnt('arialbd.ttf',  13)
f_pin_h  = fnt('georgiab.ttf', 28)
f_pin_sub= fnt('georgia.ttf',  16)

# ── Height calculations ────────────────────────────────────────────────────────
W = 1700

HEADER_H = 190
RAT_H    = 74
GAP_TOP  = 20
ROW_H    = 34
TH_H     = 36

FRONT_H = 22 + TH_H + 9*35 + ROW_H + 2
BACK_H  = 10 + 22 + TH_H + 9*35 + ROW_H + 1 + ROW_H + 2
RULES_H = 20 + 4*28 + 14
FOOTER_H = 92
BORDER_PAD = 8

H = (HEADER_H + RAT_H + GAP_TOP + FRONT_H + BACK_H +
     RULES_H + FOOTER_H + BORDER_PAD)

img = Image.new('RGB', (W, H), CREAM)
d   = ImageDraw.Draw(img)

def ctext(x, y, text, font, fill):
    d.text((x, y), text, font=font, fill=fill, anchor='mm')
def ltext(x, y, text, font, fill):
    d.text((x, y), text, font=font, fill=fill, anchor='lm')
def rtext(x, y, text, font, fill):
    d.text((x, y), text, font=font, fill=fill, anchor='rm')

# ── HEADER ─────────────────────────────────────────────────────────────────────
d.rectangle([0, 0, W, HEADER_H], fill=DARK_GREEN)
d.rectangle([0, HEADER_H-6, W, HEADER_H-3], fill=GOLD)
d.rectangle([0, HEADER_H-2, W, HEADER_H],   fill=GOLD_LIGHT)
d.rectangle([0, 0, 8, HEADER_H],  fill=GOLD)
d.rectangle([W-8, 0, W, HEADER_H], fill=GOLD)

ctext(W//2, 68,  'WESTWOOD HILLS', f_title, WHITE)
ctext(W//2, 122, 'COUNTRY CLUB',   f_sub,   GOLD)
ctext(W//2, 158,
      'Est. 1936  \u00b7  Poplar Bluff, Missouri  \u00b7  (573) 785-8211',
      f_tag, (180, 180, 160))

# ── TEE RATINGS BAR ────────────────────────────────────────────────────────────
RAT_Y = HEADER_H + 2
d.rectangle([0, RAT_Y, W, RAT_Y+RAT_H], fill=MED_GREEN)

tees = [
    ('BLACK', '69.6 / 122', '6,279 yds', (30,30,30),    WHITE),
    ('BLUE',  '68.2 / 119', '5,868 yds', BLUE_TEE,      WHITE),
    ('WHITE', '68.7 / 117', '5,450 yds', (210,210,210), (210,210,210)),
    ('RED',   '67.3 / 116', '4,735 yds', RED_TEE,       WHITE),
]
slot_w = W // 4
for i, (name, rating, yards, col, tcol) in enumerate(tees):
    cx = slot_w * i + slot_w // 2
    r  = 9
    d.ellipse([cx-r, RAT_Y+12-r, cx+r, RAT_Y+12+r], fill=col)
    ctext(cx, RAT_Y+30, name,   f_th,     tcol)
    ctext(cx, RAT_Y+47, rating, f_rating, GOLD_LIGHT)
    ctext(cx, RAT_Y+63, yards,  f_small,  (170,170,150))

# ── TABLE SETUP ────────────────────────────────────────────────────────────────
COL_LABELS = ['HOLE','PAR','HDCP','BLACK','BLUE','WHITE','RED','','SCORE','HCP','NET']
COL_W      = [  60,   55,   65,   115,    115,   115,   115,  18,  105,   85,  105]

COL_X = [0]
for w in COL_W:
    COL_X.append(COL_X[-1] + w)

TABLE_W     = sum(COL_W)
TABLE_LEFT  = (W - TABLE_W) // 2
TABLE_RIGHT = TABLE_LEFT + TABLE_W

tee_col_fill = {3: BLACK_TEE, 4: BLUE_TEE, 5: WHITE_TEE, 6: RED_TEE}

def col_cx(c):
    return TABLE_LEFT + COL_X[c] + COL_W[c] // 2

def draw_header_row(y):
    d.rectangle([TABLE_LEFT, y, TABLE_RIGHT, y+TH_H-1], fill=DARK_GREEN)
    fills = [WHITE, WHITE, WHITE,
             (180,220,255), (150,195,240), (215,215,215), (255,155,155),
             WHITE, GOLD_LIGHT, GOLD_LIGHT, GOLD_LIGHT]
    for c, label in enumerate(COL_LABELS):
        if not label: continue
        ctext(col_cx(c), y+TH_H//2, label, f_th, fills[c])

def draw_data_row(y, vals, bg):
    data = list(vals) + ['', '', '', '']
    d.rectangle([TABLE_LEFT, y, TABLE_RIGHT, y+ROW_H-1], fill=bg)
    for c, val in enumerate(data):
        if c >= len(COL_LABELS) or not COL_LABELS[c] or val == '': continue
        ctext(col_cx(c), y+ROW_H//2, str(val), f_td,
              tee_col_fill.get(c, TEXT_DARK))

def draw_total_row(y, vals):
    data = list(vals) + ['', '', '', '']
    d.rectangle([TABLE_LEFT, y, TABLE_RIGHT, y+ROW_H-1], fill=TOTAL_ROW)
    for c, val in enumerate(data):
        if c >= len(COL_LABELS) or not COL_LABELS[c] or val == '': continue
        ctext(col_cx(c), y+ROW_H//2, str(val), f_td_b,
              tee_col_fill.get(c, DARK_GREEN))

def draw_divider(y, thick=1, color=RULE_LINE):
    d.rectangle([TABLE_LEFT, y, TABLE_RIGHT, y+thick], fill=color)

def section_label(y, text):
    d.rectangle([TABLE_LEFT, y, TABLE_RIGHT, y+22], fill=MED_GREEN)
    ltext(TABLE_LEFT+12, y+11, text, f_sec, GOLD_LIGHT)

# ── SCORECARD DATA ─────────────────────────────────────────────────────────────
front9 = [
    (1,  4, 10, 350, 321, 300, 259),
    (2,  5,  4, 485, 470, 450, 410),
    (3,  3, 18, 175, 160, 142, 125),
    (4,  4,  8, 404, 364, 309, 290),
    (5,  4,  6, 403, 385, 370, 296),
    (6,  4, 14, 320, 303, 282, 273),
    (7,  4, 12, 356, 308, 288, 268),
    (8,  3, 16, 214, 192, 174, 130),
    (9,  5,  2, 531, 493, 424, 400),
]
front_out = ('OUT', 36, '\u2014', '3,238', '2,996', '2,739', '2,451')

back9 = [
    (10, 3, 13, 194, 187, 181, 160),
    (11, 4,  3, 404, 360, 333, 263),
    (12, 3, 17, 147, 131, 130,  91),
    (13, 4,  9, 387, 363, 341, 281),
    (14, 5,  1, 526, 485, 474, 374),
    (15, 4,  7, 387, 376, 330, 275),
    (16, 3, 15, 166, 158, 158, 142),
    (17, 4, 11, 340, 330, 311, 281),
    (18, 5,  5, 490, 482, 453, 417),
]
back_in  = ('IN',  35, '\u2014', '3,041', '2,872', '2,711', '2,284')
back_tot = ('TOT', 71, '\u2014', '6,279', '5,868', '5,450', '4,735')

# ── DRAW TABLES ────────────────────────────────────────────────────────────────
y = RAT_Y + RAT_H + GAP_TOP

section_label(y, 'FRONT NINE'); y += 22
draw_header_row(y);             y += TH_H
draw_divider(y)
for i, row in enumerate(front9):
    draw_data_row(y, row, LIGHT_ROW if i % 2 == 0 else ALT_ROW)
    y += ROW_H
    draw_divider(y)
draw_total_row(y, front_out); y += ROW_H
draw_divider(y, 2, DARK_GREEN); y += 2

y += 10
section_label(y, 'BACK NINE'); y += 22
draw_header_row(y);            y += TH_H
draw_divider(y)
for i, row in enumerate(back9):
    draw_data_row(y, row, LIGHT_ROW if i % 2 == 0 else ALT_ROW)
    y += ROW_H
    draw_divider(y)
draw_total_row(y, back_in);  y += ROW_H
draw_divider(y)
draw_total_row(y, back_tot); y += ROW_H
draw_divider(y, 2, DARK_GREEN); y += 2

# ── RULES ──────────────────────────────────────────────────────────────────────
y += 20
d.rectangle([TABLE_LEFT, y, TABLE_RIGHT, y+2], fill=GOLD)
y += 16

rules = [
    ('USGA Rules Govern All Play',                                    True),
    ('All Yardage Markers To Middle of Green',                        False),
    ('Soft Spikes Only',                                              False),
    ('Observe All Signs And Marked Areas',                            False),
    ('Observe Cart Trail Rules Posted On 1st And 10th Tees',          False),
    ('Repair Ball Marks  \u00b7  Replace Divots  \u00b7  Rake Bunkers', False),
    ('Maintain Pace Of Play For The Enjoyment Of All',                False),
]
rule_lh  = 28
half_col = TABLE_W // 2

for i, (rule, bold) in enumerate(rules):
    rx = TABLE_LEFT + 16 + (i % 2) * half_col
    ry = y + (i // 2) * rule_lh
    ltext(rx, ry + rule_lh//2, rule,
          f_rule_b if bold else f_rule,
          DARK_GREEN if bold else TEXT_MID)

rules_rows = (len(rules) + 1) // 2
y += rules_rows * rule_lh + 14

# ── FOOTER BAND ────────────────────────────────────────────────────────────────
d.rectangle([0, y, W, y+FOOTER_H], fill=DARK_GREEN)
d.rectangle([0, y, W, y+2], fill=GOLD)

fy = y + 16
ltext(30, fy,    'DATE:     ____________________', f_small, (200,200,180))
ltext(30, fy+26, 'SCORER:  ____________________', f_small, (200,200,180))
ltext(30, fy+52, 'ATTEST:  ____________________', f_small, (200,200,180))

q1 = W // 4
q3 = W * 3 // 4
ctext(q1, fy+8,  'James M. Vernon',       f_staff,   WHITE)
ctext(q1, fy+30, 'Director of Golf',      f_staff_t, GOLD_LIGHT)
ctext(q3, fy+8,  'Travis Whiteley',       f_staff,   WHITE)
ctext(q3, fy+30, 'Course Superintendent', f_staff_t, GOLD_LIGHT)

rtext(W-30, fy,    '#1 Birdie Lane, Poplar Bluff, MO 63901',               f_small, (200,200,180))
rtext(W-30, fy+26, '(573) 785-8211  \u00b7  westwoodhillscountryclub.com', f_small, (200,200,180))

y += FOOTER_H

# ── OUTER GOLD BORDER ──────────────────────────────────────────────────────────
d.rectangle([0, 0, W-1, H-1], outline=GOLD, width=6)

img.save(OUT, 'JPEG', quality=92)
print(f'Saved {W}x{H}px -> {OUT}')
