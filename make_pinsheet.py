from PIL import Image, ImageDraw, ImageFont
import os

F   = r'C:\Windows\Fonts'
OUT = r'C:\Users\sctr1\claude\images\pinsheet.jpg'

# ── Colors ───────────────────────────────────────────────────────────────────
DARK_GREEN   = ( 26,  43,  31)
MED_GREEN    = ( 38,  62,  44)
GOLD         = (196, 160,  80)
GOLD_LIGHT   = (220, 190, 110)
CREAM        = (252, 248, 240)
WHITE        = (255, 255, 255)
PANEL_BG     = (245, 249, 244)
PUTTING_GRN  = ( 65, 120,  58)
FRINGE       = ( 85, 148,  76)
BUNKER       = (210, 195, 148)
DIV_LINE     = ( 45,  90,  40)   # section divider lines within green
PIN_RED      = (195,  42,  42)
TEXT_DARK    = ( 20,  20,  20)
TEXT_MID     = ( 90,  90,  90)
TEXT_LIGHT   = (170, 170, 170)
LBL_WHITE    = (240, 240, 235)   # section letter color on green

# ── Fonts ────────────────────────────────────────────────────────────────────
def fnt(name, size):
    try:    return ImageFont.truetype(os.path.join(F, name), size)
    except: return ImageFont.load_default()

f_title  = fnt('georgiab.ttf', 52)
f_sub    = fnt('georgia.ttf',  20)
f_date   = fnt('arial.ttf',    17)
f_hole   = fnt('georgiab.ttf', 38)
f_par    = fnt('arialbd.ttf',  15)
f_hdcp   = fnt('arial.ttf',    13)
f_sec    = fnt('georgiab.ttf', 24)
f_foot   = fnt('arial.ttf',    15)
f_depth  = fnt('arial.ttf',    13)
f_label  = fnt('arialbd.ttf',  14)   # section letter on green

# ── Scorecard data ────────────────────────────────────────────────────────────
HOLES = [
    {'n': 1, 'par':4,'hdcp': 5},  {'n': 2, 'par':3,'hdcp':15},
    {'n': 3, 'par':4,'hdcp': 3},  {'n': 4, 'par':4,'hdcp': 1},
    {'n': 5, 'par':3,'hdcp':17},  {'n': 6, 'par':5,'hdcp':11},
    {'n': 7, 'par':4,'hdcp': 7},  {'n': 8, 'par':4,'hdcp': 9},
    {'n': 9, 'par':4,'hdcp':13},
    {'n':10, 'par':5,'hdcp': 8},  {'n':11, 'par':4,'hdcp': 4},
    {'n':12, 'par':3,'hdcp':16},  {'n':13, 'par':4,'hdcp': 2},
    {'n':14, 'par':4,'hdcp': 6},  {'n':15, 'par':5,'hdcp':12},
    {'n':16, 'par':4,'hdcp':10},  {'n':17, 'par':3,'hdcp':18},
    {'n':18, 'par':4,'hdcp':14},
]

# Today's depth (yards from front edge to pin) — read from scorecard photo
DEPTH = [32, 30, 26, 30, 32, 40, 23, 20, 30,   # H1–H9
         28, 21, 29, 30, 35, 15, 20, 35, 20]    # H10–H18

# ── Green shapes — traced from actual scorecard photos ────────────────────────
# Coordinates in unit space (−1..1): x right, y down (y=−1 = back/far,  y=1 = front/near)
# Approach comes from BELOW each diagram (front = bottom, back = top)
GREENS = [
    # H1 par4 — bilobed crown top, widens to right, tapers lower-left
    # Photo: two distinct upper bumps, large bunker lower-right outside
    [(-0.80,-0.15),(-0.65,-0.60),(-0.15,-0.85),(0.10,-0.60),(0.00,-0.20),
     (0.35,-0.75),(0.72,-0.55),(0.88,-0.05),(0.80,0.40),(0.50,0.75),
     (0.05,0.85),(-0.40,0.65),(-0.75,0.25)],

    # H2 par3 — 3-lobed trefoil (top lobe + left lobe + right-lower lobe)
    # Photo: shamrock-like shape, 3 distinct rounded lobes
    [(-0.60,-0.80),(-0.10,-0.90),(0.40,-0.65),(0.78,-0.25),(0.80,0.18),
     (0.50,0.65),(0.10,0.80),(-0.30,0.62),(-0.68,0.20),(-0.82,-0.28)],

    # H3 par4 — large main body with prominent right extension
    # Photo: main blob with a noticeable lobe extending right
    [(-0.78,-0.48),(-0.20,-0.85),(0.28,-0.82),(0.70,-0.50),(0.90,-0.05),
     (0.88,0.35),(0.62,0.72),(0.15,0.88),(-0.30,0.75),(-0.72,0.42),(-0.85,0.02)],

    # H4 par4 — wide with two bumps at top creating W-shaped top edge
    # Photo: wide rectangular-ish shape, bumps at upper-left and upper-right
    [(-0.88,-0.28),(-0.70,-0.68),(-0.25,-0.85),(0.05,-0.55),(0.30,-0.82),
     (0.72,-0.58),(0.90,-0.12),(0.85,0.35),(0.58,0.72),(0.08,0.85),
     (-0.45,0.72),(-0.82,0.35)],

    # H5 par3 — elongated oval, slightly wider middle, nearly symmetrical
    # Photo: rounded oval/pear, no bunkers, lots of sections
    [(-0.58,-0.55),(-0.10,-0.82),(0.42,-0.75),(0.75,-0.32),(0.78,0.22),
     (0.52,0.72),(0.00,0.88),(-0.50,0.68),(-0.78,0.18)],

    # H6 par5 — wide irregular blob with slight bumps on outline
    # Photo: wide shape with 3+ bumps, bunker lower-left
    [(-0.92,-0.25),(-0.65,-0.70),(-0.10,-0.88),(0.38,-0.78),(0.82,-0.42),
     (0.92,0.08),(0.75,0.55),(0.28,0.85),(-0.22,0.90),(-0.68,0.62),(-0.92,0.28)],

    # H7 par4 — irregular, concave area on left, extended right side
    # Photo: concave left edge, rounded right, bunker to the LEFT of green
    [(-0.72,-0.55),(-0.15,-0.82),(0.32,-0.72),(0.78,-0.35),(0.88,0.12),
     (0.65,0.58),(0.18,0.80),(-0.15,0.72),(-0.42,0.48),(-0.68,0.18),(-0.75,-0.15)],

    # H8 par4 — wide, roughly rectangular with rounded corners
    # Photo: wide and relatively even shape, 6 sections visible
    [(-0.88,-0.35),(-0.45,-0.78),(0.08,-0.85),(0.55,-0.65),(0.88,-0.15),
     (0.85,0.32),(0.55,0.72),(0.05,0.85),(-0.45,0.70),(-0.85,0.30)],

    # H9 par4 — wide blob with two bumps at top
    # Photo: similar to H1 bilobed top, bunker lower-right
    [(-0.80,-0.22),(-0.62,-0.62),(-0.15,-0.85),(0.12,-0.60),(0.08,-0.20),
     (0.40,-0.78),(0.78,-0.45),(0.88,0.02),(0.75,0.50),(0.28,0.80),
     (-0.22,0.82),(-0.65,0.52)],

    # H10 par5 — wide multi-lobed, 3+ bumps visible
    # Photo: 3 distinct lobes, bunker to the right
    [(-0.90,-0.30),(-0.55,-0.75),(0.00,-0.90),(0.42,-0.75),(0.72,-0.42),
     (0.88,-0.05),(0.85,0.38),(0.55,0.78),(0.08,0.90),(-0.40,0.78),
     (-0.80,0.45),(-0.92,0.05)],

    # H11 par4 — 3-lobed (similar to H2 but larger), bunker below-left
    # Photo: multi-lobed organic shape, elongated bunker to lower-left
    [(-0.78,-0.52),(-0.25,-0.85),(0.25,-0.78),(0.72,-0.45),(0.88,0.05),
     (0.72,0.52),(0.22,0.82),(-0.28,0.78),(-0.62,0.48),(-0.85,0.05)],

    # H12 par3 — smaller compact shape with 2 bunkers flanking
    # Photo: smaller green (par 3), bunkers on both sides
    [(-0.55,-0.58),(-0.05,-0.82),(0.48,-0.65),(0.75,-0.12),(0.68,0.45),
     (0.20,0.78),(-0.32,0.72),(-0.68,0.28)],

    # H13 par4 — wide, somewhat rounded rectangular
    # Photo: wide blob, one bunker visible
    [(-0.88,-0.32),(-0.50,-0.72),(0.00,-0.88),(0.50,-0.72),(0.88,-0.32),
     (0.88,0.22),(0.55,0.68),(0.00,0.85),(-0.55,0.65),(-0.88,0.22)],

    # H14 par4 — large angled shape, one big bunker
    # Photo: elongated blob angled, single large bunker
    [(-0.70,-0.60),(-0.15,-0.88),(0.40,-0.78),(0.82,-0.38),(0.90,0.12),
     (0.72,0.62),(0.18,0.85),(-0.35,0.72),(-0.78,0.35)],

    # H15 par5 — grand signature green, large with multiple bunkers
    # Photo: large flowing shape (par 5), 2-3 bunkers
    [(-0.95,-0.25),(-0.62,-0.72),(-0.08,-0.92),(0.42,-0.82),(0.82,-0.48),
     (0.95,0.00),(0.82,0.48),(0.40,0.82),(-0.12,0.92),(-0.62,0.68),(-0.90,0.28)],

    # H16 par4 — medium, two bunkers one each side
    # Photo: rounded, bunkers flanking on both sides
    [(-0.75,-0.55),(-0.15,-0.85),(0.42,-0.72),(0.82,-0.22),(0.82,0.32),
     (0.48,0.75),(0.00,0.85),(-0.48,0.68),(-0.82,0.25)],

    # H17 par3 — small (par 3), one bunker to the right
    # Photo: compact, circular-ish, single bunker right side
    [(-0.55,-0.52),(0.05,-0.78),(0.58,-0.52),(0.78,0.00),(0.60,0.55),
     (0.05,0.80),(-0.52,0.55),(-0.75,0.00)],

    # H18 par4 — grand oval, finishing hole, one or two bunkers
    # Photo: large wide shape, prominent bunker
    [(-0.88,-0.38),(-0.45,-0.82),(0.10,-0.92),(0.58,-0.72),(0.90,-0.28),
     (0.95,0.20),(0.75,0.62),(0.25,0.88),(-0.32,0.80),(-0.75,0.50),(-0.92,0.08)],
]

# ── Bunkers — (cx, cy, rx, ry) in unit coords, positioned per photo ───────────
BUNKERS = [
    # H1: large bunker lower-right (outside green, below-right)
    [(0.88, 0.82, 0.30, 0.18)],
    # H2: two bunkers - lower-left and right side
    [(-0.88, 0.72, 0.22, 0.15), (0.90, 0.42, 0.20, 0.14)],
    # H3: one large bunker lower-right
    [(0.92, 0.62, 0.28, 0.17)],
    # H4: no significant bunkers visible
    [],
    # H5: no bunkers visible
    [],
    # H6: one bunker lower-left
    [(-0.90, 0.75, 0.25, 0.16)],
    # H7: large bunker to the LEFT of green
    [(-0.95, 0.15, 0.28, 0.40)],
    # H8: no significant bunkers
    [],
    # H9: bunker lower-right outside green
    [(0.90, 0.75, 0.25, 0.16)],
    # H10: one bunker to the right
    [(0.95, 0.30, 0.22, 0.16)],
    # H11: elongated bunker below-left
    [(-0.88, 0.75, 0.30, 0.15)],
    # H12: two bunkers flanking - upper-left and lower-right
    [(-0.88, -0.62, 0.20, 0.14), (0.88, 0.58, 0.20, 0.14)],
    # H13: one bunker right side
    [(0.92, -0.28, 0.22, 0.16)],
    # H14: one large bunker lower-left
    [(-0.90, 0.70, 0.26, 0.16)],
    # H15: two bunkers, left and right
    [(-0.92, -0.45, 0.22, 0.15), (0.92, 0.45, 0.22, 0.15)],
    # H16: two bunkers flanking
    [(-0.88, 0.42, 0.20, 0.14), (0.88, -0.38, 0.20, 0.14)],
    # H17: one bunker right side
    [(0.90, 0.32, 0.20, 0.14)],
    # H18: one bunker and one smaller
    [(-0.90, 0.68, 0.25, 0.16), (0.88, -0.55, 0.20, 0.14)],
]

# ── Section letters — (label, x_unit, y_unit) per hole ────────────────────────
# Layout: 2 sections BACK (top), 1 section MIDDLE, 2 sections FRONT (bottom)
# y_unit: -1=far/back, +1=near/front  x_unit: -1=left, +1=right
# Positions: back-left(-0.38,-0.52), back-right(0.38,-0.52),
#            middle(0.0,0.0), front-left(-0.38,0.52), front-right(0.38,0.52)

# Each hole: [back-left, back-right, middle, front-left, front-right]
SECTION_LETTERS = [
    ['D','C','A','E','B'],  # H1 — per photo: D upper-center, C upper-right, A right, E lower-left, B lower
    ['B','A','D','E','C'],  # H2 — per photo: B top-left, A top-right, D upper-center, E lower-left, C lower
    ['A','B','E','D','C'],  # H3 — per photo: A upper-left, B upper-right, E left, D right, C lower
    ['A','C','E','B','D'],  # H4 — per photo: A top-left, C top-right, E left, D center, B lower-right
    ['D','B','C','A','E'],  # H5 — per photo: D top-left, B top-right, C center, A lower-left, E right
    ['E','A','C','B','D'],  # H6 — per photo: E top-left, A top-right, C upper, B lower-left, D lower-right
    ['D','C','B','E','A'],  # H7 — per photo: D upper-right, C lower-left area, B center, E bottom
    ['C','B','A','D','E'],  # H8 — per photo: C upper-left, B upper-center, A lower-left, D center-right, E lower-right
    ['C','D','B','E','A'],  # H9 — per photo: C top-left, D top-right, B left, A right, E lower
    ['A','B','C','D','E'],  # H10 — estimated (back nine harder to read)
    ['B','A','D','C','E'],  # H11 — estimated
    ['A','B','C','D','E'],  # H12 — estimated (par 3)
    ['B','A','C','D','E'],  # H13 — estimated
    ['A','B','D','C','E'],  # H14 — estimated
    ['A','B','C','D','E'],  # H15 — estimated
    ['B','A','C','E','D'],  # H16 — estimated
    ['A','B','C','D','E'],  # H17 — estimated (par 3)
    ['A','B','D','C','E'],  # H18 — estimated
]

# ── Today's pin positions (letter + position within section) ──────────────────
# Position within section: x_offset, y_offset in unit coords relative to section center
# These are per the depth values from the scorecard photo
# Depth 32 H1, 30 H2, 26 H3, 30 H4, 32 H5, 40 H6, 23 H7, 20 H8, 30 H9
# Depth 28 H10, 21 H11, 29 H12, 30 H13, 35 H14, 15 H15, 20 H16, 35 H17, 20 H18

# Format: (x_unit, y_unit) in green space — approximate based on depth
PIN = [
    (0.10, 0.18),   # H1  depth 32 — middle area, slightly right
    (-0.20, 0.42),  # H2  depth 30 — front-left
    (0.25, 0.28),   # H3  depth 26 — middle-right
    (-0.15, 0.18),  # H4  depth 30 — middle, slightly left
    (0.28, 0.20),   # H5  depth 32 — middle-right
    (-0.30, 0.55),  # H6  depth 40 — front-left (deep)
    (0.20, 0.05),   # H7  depth 23 — middle, slightly front
    (0.05, 0.05),   # H8  depth 20 — center
    (-0.25, 0.15),  # H9  depth 30 — middle-left
    (0.30, 0.48),   # H10 depth 28 — front-right
    (-0.20, 0.08),  # H11 depth 21 — middle, slightly left
    (0.20, -0.10),  # H12 depth 29 — just past middle, right
    (-0.20, 0.42),  # H13 depth 30 — front-left
    (0.30, 0.55),   # H14 depth 35 — front-right (deep)
    (-0.28, -0.52), # H15 depth 15 — back-left (very shallow)
    (0.00, 0.05),   # H16 depth 20 — center
    (0.15, 0.48),   # H17 depth 35 — front, slightly right
    (0.22, 0.05),   # H18 depth 20 — center, slightly right
]

# ── Utility: find horizontal extent of polygon at given y ─────────────────────
def poly_x_at_y(pts, y):
    """Returns (xmin, xmax) of polygon at given y, or None."""
    xs = []
    n  = len(pts)
    for i in range(n):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % n]
        if y1 == y2:
            continue
        if min(y1, y2) <= y <= max(y1, y2):
            t = (y - y1) / (y2 - y1)
            xs.append(x1 + t * (x2 - x1))
    if len(xs) >= 2:
        return min(xs), max(xs)
    return None

# ── Layout ────────────────────────────────────────────────────────────────────
W         = 1700
MARGIN    = 28
COL_GAP   = 14
COLS      = 3
PANEL_W   = (W - 2*MARGIN - (COLS-1)*COL_GAP) // COLS   # ~537
PANEL_H   = 312
ROW_GAP   = 14
HEADER_H  = 155
SEC_H     = 48
FOOTER_H  = 68

GRID_H = 3*(PANEL_H + ROW_GAP) + ROW_GAP

H = HEADER_H + SEC_H + GRID_H + SEC_H + GRID_H + FOOTER_H

img  = Image.new('RGB', (W, H), CREAM)
draw = ImageDraw.Draw(img)

# ── Header ────────────────────────────────────────────────────────────────────
draw.rectangle([0, 0, W, HEADER_H], fill=DARK_GREEN)
draw.line([(MARGIN, 18), (W-MARGIN, 18)], fill=GOLD, width=1)
draw.line([(MARGIN, HEADER_H-6), (W-MARGIN, HEADER_H-6)], fill=GOLD, width=1)
for sx in [MARGIN+22, W-MARGIN-22]:
    draw.regular_polygon((sx, HEADER_H//2, 7), 4, fill=GOLD, rotation=45)

draw.text((W//2, 48),  'PIN LOCATIONS',                      font=f_title, fill=WHITE,      anchor='mm')
draw.text((W//2, 90),  'WESTWOOD HILLS COUNTRY CLUB',        font=f_sub,   fill=GOLD,       anchor='mm')
draw.text((W//2, 116), 'TODAY\'S HOLE LOCATIONS',            font=f_date,  fill=GOLD_LIGHT, anchor='mm')
draw.text((W//2, 138), '— Approach from below · Front of green at bottom of each diagram —',
          font=fnt('arial.ttf',11), fill=GOLD_LIGHT, anchor='mm')

# ── Section label bar ─────────────────────────────────────────────────────────
def section_label(y, text):
    draw.rectangle([0, y, W, y+SEC_H], fill=MED_GREEN)
    draw.line([(MARGIN, y+1), (W-MARGIN, y+1)], fill=GOLD, width=1)
    draw.line([(MARGIN, y+SEC_H-2), (W-MARGIN, y+SEC_H-2)], fill=GOLD, width=1)
    draw.text((W//2, y+SEC_H//2), text, font=f_sec, fill=GOLD, anchor='mm')

# ── Draw one hole panel ───────────────────────────────────────────────────────
BAR_H  = 40    # top bar: hole #, par, hdcp
BOT_H  = 34    # bottom: depth label
GRN_H  = PANEL_H - BAR_H - BOT_H   # green area height

def draw_panel(px, py, hole, pos, depth):
    idx  = hole['n'] - 1
    sc   = {3: 0.72, 4: 0.88, 5: 1.00}.get(hole['par'], 0.88)

    # ── Panel background + outer border ──────────────────────────────────────
    draw.rectangle([px, py, px+PANEL_W, py+PANEL_H], fill=PANEL_BG)
    draw.rectangle([px, py, px+PANEL_W, py+PANEL_H], outline=DARK_GREEN, width=1)

    # ── Top bar ───────────────────────────────────────────────────────────────
    draw.rectangle([px, py, px+PANEL_W, py+BAR_H], fill=DARK_GREEN)
    draw.text((px+14,          py+BAR_H//2), str(hole['n']), font=f_hole, fill=GOLD,       anchor='lm')
    draw.text((px+PANEL_W//2,  py+BAR_H//2), f'PAR  {hole["par"]}', font=f_par, fill=WHITE, anchor='mm')
    draw.text((px+PANEL_W-10,  py+BAR_H//2), f'HCP {hole["hdcp"]}', font=f_hdcp, fill=GOLD_LIGHT, anchor='rm')

    # ── Green geometry ────────────────────────────────────────────────────────
    GX  = px + PANEL_W // 2
    GY  = py + BAR_H + GRN_H // 2
    GRX = (PANEL_W - 90) // 2
    GRY = (GRN_H - 18) // 2

    def u2p(ux, uy, scale=1.0):
        """Unit coords to pixel coords."""
        s = sc * scale
        return (int(GX + ux * GRX * s), int(GY + uy * GRY * s))

    # Polygon points in pixel space
    gpts   = [u2p(*p) for p in GREENS[idx]]
    fringe = [u2p(*p, scale=1.12) for p in GREENS[idx]]

    # ── Fringe ────────────────────────────────────────────────────────────────
    draw.polygon(fringe, fill=FRINGE)

    # ── Bunkers ───────────────────────────────────────────────────────────────
    for b in BUNKERS[idx]:
        bcx = int(GX + b[0] * GRX * sc)
        bcy = int(GY + b[1] * GRY * sc)
        brx = max(9, int(b[2] * GRX * sc))
        bry = max(7, int(b[3] * GRY * sc))
        draw.ellipse([bcx-brx, bcy-bry, bcx+brx, bcy+bry], fill=BUNKER)

    # ── Putting surface ───────────────────────────────────────────────────────
    draw.polygon(gpts, fill=PUTTING_GRN)

    # ── Section divider lines (clipped to green polygon via scanline) ──────────
    # 2 horizontal dividers at y_unit = −0.22 and +0.22 (roughly thirds)
    for y_u in [-0.22, 0.22]:
        y_px = int(GY + y_u * GRY * sc)
        bounds = poly_x_at_y(gpts, y_px)
        if bounds:
            xl, xr = int(bounds[0]), int(bounds[1])
            draw.line([(xl, y_px), (xr, y_px)], fill=DIV_LINE, width=1)

    # 1 vertical divider at x_unit = 0, from top row to bottom row boundaries
    # Draw only for the top third and bottom third (not middle)
    x_px = int(GX)
    # Top row: from top of green to first divider
    y_top = int(GY - GRY * sc)          # approximate top of green bounding box
    y_div1 = int(GY + (-0.22) * GRY * sc)
    y_div2 = int(GY + 0.22 * GRY * sc)
    y_bot  = int(GY + GRY * sc)          # approximate bottom
    for y_start, y_end in [(y_top, y_div1), (y_div2, y_bot)]:
        for y_px in range(y_start, y_end):
            bounds = poly_x_at_y(gpts, y_px)
            if bounds and bounds[0] <= x_px <= bounds[1]:
                break  # just check first valid row to see if line is inside
        # Draw the vertical segment clipped to green
        for y_px in range(y_start, y_end + 1):
            bounds = poly_x_at_y(gpts, y_px)
            if bounds and bounds[0] <= x_px <= bounds[1]:
                draw.point((x_px, y_px), fill=DIV_LINE)

    # ── Section letter labels ──────────────────────────────────────────────────
    # Positions: (x_unit, y_unit) for [back-left, back-right, middle, front-left, front-right]
    label_positions = [(-0.40,-0.52), (0.40,-0.52), (0.00, 0.00), (-0.40, 0.52), (0.40, 0.52)]
    letters = SECTION_LETTERS[idx]
    for (lx, ly), letter in zip(label_positions, letters):
        lxp, lyp = u2p(lx, ly)
        # Draw white letter with dark shadow for readability
        draw.text((lxp+1, lyp+1), letter, font=f_label, fill=(0,0,0,100), anchor='mm')
        draw.text((lxp,   lyp),   letter, font=f_label, fill=LBL_WHITE,   anchor='mm')

    # ── Green outline (drawn last so it's clean) ──────────────────────────────
    draw.polygon(gpts, outline=DARK_GREEN, width=2)

    # ── Pin marker ────────────────────────────────────────────────────────────
    px_abs, py_abs = u2p(pos[0], pos[1])
    POLE = 24
    draw.line([(px_abs, py_abs), (px_abs, py_abs - POLE)], fill=PIN_RED, width=2)
    draw.polygon([
        (px_abs,    py_abs - POLE),
        (px_abs+12, py_abs - POLE + 6),
        (px_abs,    py_abs - POLE + 12),
    ], fill=PIN_RED)
    R = 4
    draw.ellipse([px_abs-R, py_abs-R, px_abs+R, py_abs+R], fill=WHITE, outline=TEXT_DARK, width=1)

    # ── Bottom band: depth value ──────────────────────────────────────────────
    bot_y = py + PANEL_H - BOT_H // 2
    draw.text((px + PANEL_W//2, bot_y),
              f'Depth  {depth} yds', font=f_depth, fill=TEXT_MID, anchor='mm')

# ── Draw grid ─────────────────────────────────────────────────────────────────
def draw_grid(y_start, holes, pins, depths):
    for i, (hole, pos, dep) in enumerate(zip(holes, pins, depths)):
        row = i // COLS
        col = i  % COLS
        px  = MARGIN + col*(PANEL_W + COL_GAP)
        py  = y_start + ROW_GAP + row*(PANEL_H + ROW_GAP)
        draw_panel(px, py, hole, pos, dep)

# ── Assemble ──────────────────────────────────────────────────────────────────
y = HEADER_H
section_label(y, '— FRONT NINE  ·  HOLES 1 – 9 —')
y += SEC_H
draw_grid(y, HOLES[:9], PIN[:9], DEPTH[:9])
y += GRID_H

section_label(y, '— BACK NINE  ·  HOLES 10 – 18 —')
y += SEC_H
draw_grid(y, HOLES[9:], PIN[9:], DEPTH[9:])
y += GRID_H

# ── Footer ────────────────────────────────────────────────────────────────────
draw.rectangle([0, y, W, H], fill=DARK_GREEN)
draw.line([(MARGIN, y+6), (W-MARGIN, y+6)], fill=GOLD, width=1)
fy = y + FOOTER_H // 2 + 4
draw.text((MARGIN+10,   fy), 'Westwood Hills Country Club',        font=f_foot, fill=GOLD,       anchor='lm')
draw.text((W//2,        fy), 'Pin locations subject to change · Verify with Pro Shop', font=fnt('arial.ttf',14), fill=GOLD_LIGHT, anchor='mm')
draw.text((W-MARGIN-10, fy), 'info@westwoodhillscountryclub.com', font=fnt('arial.ttf',14), fill=GOLD_LIGHT, anchor='rm')

# ── Gold outer border ─────────────────────────────────────────────────────────
for i in range(6):
    draw.rectangle([i, i, W-1-i, H-1-i], outline=GOLD)

# ── Save ──────────────────────────────────────────────────────────────────────
img.save(OUT, 'JPEG', quality=92)
print(f'Saved {W}x{H}px -> {OUT}')
