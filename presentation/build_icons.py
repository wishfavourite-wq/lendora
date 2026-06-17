# -*- coding: utf-8 -*-
"""Generates a small flat-badge icon set matching the elegant-workplan template
palette (dk2 #4C6A78 / accent1 #E0B4A4 badges, white glyphs), as transparent PNGs.
"""
import os
from PIL import Image, ImageDraw

DK1 = (28, 52, 60, 255)
CREAM = (240, 235, 228, 255)
DK2 = (76, 106, 120, 255)
ACCENT = (224, 180, 164, 255)
WHITE = (255, 255, 255, 255)

S = 240
C = S // 2
OUT = "icons"
os.makedirs(OUT, exist_ok=True)


def canvas():
    return Image.new("RGBA", (S, S), (0, 0, 0, 0))


def badge(im, color):
    d = ImageDraw.Draw(im)
    pad = 6
    d.ellipse([pad, pad, S - pad, S - pad], fill=color)
    return d


def line(d, pts, w, fill=WHITE):
    d.line(pts, fill=fill, width=w, joint="curve")


# ---- glyph drawers (each draws onto an already-badged ImageDraw `d`) -------

def g_house(d):
    line(d, [(70, 130), (120, 85), (170, 130)], 10)
    d.rectangle([85, 120, 155, 175], outline=WHITE, width=9)
    d.rectangle([108, 145, 132, 175], outline=WHITE, width=8)

def g_store(d):
    d.rectangle([70, 110, 170, 175], outline=WHITE, width=9)
    line(d, [(60, 110), (70, 75), (170, 75), (180, 110)], 9)
    for x in (90, 120, 150):
        line(d, [(x, 110), (x, 130)], 6)

def g_user(d):
    d.ellipse([95, 65, 145, 115], outline=WHITE, width=10)
    d.arc([65, 120, 175, 210], start=200, end=340, fill=WHITE, width=12)

def g_user_plus(d):
    g_user(d)
    line(d, [(178, 70), (178, 100)], 8)
    line(d, [(163, 85), (193, 85)], 8)

def g_shield_check(d):
    d.polygon([(120, 60), (172, 80), (172, 130), (120, 178), (68, 130), (68, 80)], outline=WHITE, width=9)
    line(d, [(95, 122), (115, 142), (150, 95)], 11)

def g_grid(d):
    for x in (68, 130):
        for y in (68, 130):
            d.rounded_rectangle([x, y, x + 44, y + 44], radius=8, outline=WHITE, width=9)

def g_box(d):
    d.polygon([(120, 60), (180, 92), (120, 124), (60, 92)], outline=WHITE, width=8)
    line(d, [(60, 92), (60, 150), (120, 182), (180, 150), (180, 92)], 8)
    line(d, [(120, 124), (120, 182)], 8)

def g_search(d):
    d.ellipse([65, 65, 150, 150], outline=WHITE, width=11)
    line(d, [(143, 143), (180, 180)], 13)

def g_calendar(d):
    d.rounded_rectangle([62, 75, 178, 175], radius=10, outline=WHITE, width=9)
    line(d, [(62, 105), (178, 105)], 9)
    line(d, [(90, 60), (90, 85)], 8)
    line(d, [(150, 60), (150, 85)], 8)
    d.ellipse([102, 128, 122, 148], fill=WHITE)

def g_check_circle(d):
    d.ellipse([60, 60, 180, 180], outline=WHITE, width=10)
    line(d, [(90, 122), (112, 146), (155, 95)], 11)

def g_wallet(d):
    d.rounded_rectangle([55, 90, 185, 165], radius=14, outline=WHITE, width=9)
    d.rounded_rectangle([135, 110, 185, 148], radius=8, outline=WHITE, width=8)
    d.ellipse([150, 122, 166, 138], fill=WHITE)

def g_truck(d):
    d.rectangle([45, 100, 135, 155], outline=WHITE, width=9)
    d.polygon([(135, 115), (175, 115), (195, 140), (195, 155), (135, 155)], outline=WHITE, width=9)
    d.ellipse([65, 150, 95, 180], outline=WHITE, width=8)
    d.ellipse([150, 150, 180, 180], outline=WHITE, width=8)

def g_alert(d):
    d.polygon([(120, 55), (190, 175), (50, 175)], outline=WHITE, width=10)
    line(d, [(120, 100), (120, 142)], 10)
    d.ellipse([114, 152, 126, 164], fill=WHITE)

def g_refresh(d):
    d.arc([60, 60, 180, 180], start=-40, end=230, fill=WHITE, width=12)
    d.polygon([(170, 55), (190, 90), (152, 92)], fill=WHITE)

def g_camera(d):
    d.rounded_rectangle([50, 95, 190, 175], radius=12, outline=WHITE, width=9)
    d.polygon([(90, 95), (105, 75), (150, 75), (165, 95)], outline=WHITE, width=8)
    d.ellipse([95, 110, 145, 160], outline=WHITE, width=9)

def g_percent(d):
    d.ellipse([60, 60, 95, 95], outline=WHITE, width=9)
    d.ellipse([145, 145, 180, 180], outline=WHITE, width=9)
    line(d, [(75, 165), (165, 75)], 9)

def g_star(d):
    import math
    cx, cy, r1, r2 = 120, 120, 70, 30
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        r = r1 if i % 2 == 0 else r2
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    d.polygon(pts, fill=WHITE)

def g_chart(d):
    line(d, [(60, 180), (180, 180)], 9)
    d.rectangle([75, 130, 100, 175], fill=WHITE)
    d.rectangle([108, 100, 133, 175], fill=WHITE)
    d.rectangle([141, 60, 166, 175], fill=WHITE)

def g_database(d):
    for y in (70, 110, 150):
        d.ellipse([60, y, 180, y + 30], outline=WHITE, width=8)
    line(d, [(60, 85), (60, 165)], 8)
    line(d, [(180, 85), (180, 165)], 8)

def g_lock(d):
    d.rounded_rectangle([70, 115, 170, 180], radius=10, outline=WHITE, width=9)
    d.arc([85, 65, 155, 140], start=180, end=360, fill=WHITE, width=10)
    d.ellipse([110, 138, 130, 158], fill=WHITE)

def g_lightbulb(d):
    d.ellipse([85, 60, 155, 130], outline=WHITE, width=9)
    line(d, [(100, 130), (140, 130)], 8)
    d.rectangle([102, 140, 138, 165], outline=WHITE, width=8)
    line(d, [(112, 178), (128, 178)], 8)

def g_target(d):
    for r in (70, 45, 20):
        d.ellipse([C - r, C - r, C + r, C + r], outline=WHITE, width=8)

def g_x_circle(d):
    d.ellipse([60, 60, 180, 180], outline=WHITE, width=10)
    line(d, [(90, 90), (150, 150)], 10)
    line(d, [(150, 90), (90, 150)], 10)

def g_wrench(d):
    d.arc([60, 55, 110, 105], start=30, end=300, fill=WHITE, width=11)
    line(d, [(95, 95), (175, 175)], 16)
    d.arc([150, 145, 195, 190], start=210, end=480, fill=WHITE, width=10)

def g_minus_circle(d):
    d.ellipse([60, 60, 180, 180], outline=WHITE, width=10)
    line(d, [(90, 120), (150, 120)], 11)

def g_rocket(d):
    d.polygon([(120, 55), (150, 130), (90, 130)], outline=WHITE, width=9)
    d.ellipse([100, 100, 140, 140], outline=WHITE, width=7)
    d.polygon([(90, 130), (75, 170), (100, 155)], outline=WHITE, width=7)
    d.polygon([(150, 130), (165, 170), (140, 155)], outline=WHITE, width=7)
    line(d, [(110, 145), (100, 185)], 8)
    line(d, [(130, 145), (140, 185)], 8)

def g_clipboard_check(d):
    d.rounded_rectangle([65, 70, 175, 180], radius=10, outline=WHITE, width=9)
    d.rounded_rectangle([100, 58, 140, 78], radius=6, outline=WHITE, width=7)
    line(d, [(88, 130), (110, 152), (155, 100)], 10)

def g_trophy(d):
    d.rounded_rectangle([100, 140, 140, 162], radius=3, outline=WHITE, width=7)
    line(d, [(78, 172), (162, 172)], 8)
    d.pieslice([85, 60, 155, 130], start=0, end=180, fill=WHITE)
    d.rectangle([85, 75, 155, 95], fill=WHITE)
    d.arc([55, 65, 95, 110], start=300, end=140, fill=WHITE, width=8)
    d.arc([145, 65, 185, 110], start=40, end=240, fill=WHITE, width=8)

def g_flag(d):
    line(d, [(75, 60), (75, 185)], 10)
    d.polygon([(75, 65), (170, 90), (75, 120)], outline=WHITE, width=8)

def g_heart(d):
    d.pieslice([60, 65, 120, 125], start=130, end=310, fill=WHITE)
    d.pieslice([120, 65, 180, 125], start=230, end=410, fill=WHITE)
    d.polygon([(65, 110), (175, 110), (120, 185)], fill=WHITE)

def g_document(d):
    d.rounded_rectangle([75, 55, 165, 185], radius=8, outline=WHITE, width=9)
    for y in (90, 115, 140, 162):
        line(d, [(92, y), (148, y)], 7)

def g_lightning(d):
    d.polygon([(135, 55), (85, 130), (118, 130), (105, 185), (160, 105), (125, 105)], fill=WHITE)

def g_arrow_right(d):
    line(d, [(60, 120), (165, 120)], 12)
    d.polygon([(150, 90), (190, 120), (150, 150)], fill=WHITE)

def g_monitor(d):
    d.rounded_rectangle([55, 65, 185, 150], radius=8, outline=WHITE, width=9)
    line(d, [(120, 150), (120, 175)], 8)
    line(d, [(90, 180), (150, 180)], 8)

def g_server(d):
    for y in (65, 110, 155):
        d.rounded_rectangle([60, y, 180, y + 32], radius=6, outline=WHITE, width=8)
        d.ellipse([155, y + 12, 167, y + 24], fill=WHITE)

def g_card(d):
    d.rounded_rectangle([50, 80, 190, 165], radius=12, outline=WHITE, width=9)
    line(d, [(50, 105), (190, 105)], 10)
    d.rectangle([65, 130, 100, 142], fill=WHITE)

def g_layers(d):
    for dy in (0, 28, 56):
        d.polygon([(120, 60 + dy), (185, 90 + dy), (120, 120 + dy), (55, 90 + dy)], outline=WHITE, width=7)


GLYPHS = {
    'house': g_house, 'store': g_store, 'user': g_user, 'user_plus': g_user_plus,
    'shield_check': g_shield_check, 'grid': g_grid, 'box': g_box, 'search': g_search,
    'calendar': g_calendar, 'check_circle': g_check_circle, 'wallet': g_wallet,
    'truck': g_truck, 'alert': g_alert, 'refresh': g_refresh, 'camera': g_camera,
    'percent': g_percent, 'star': g_star, 'chart': g_chart, 'database': g_database,
    'lock': g_lock, 'lightbulb': g_lightbulb, 'target': g_target, 'x_circle': g_x_circle,
    'wrench': g_wrench, 'minus_circle': g_minus_circle, 'rocket': g_rocket,
    'clipboard_check': g_clipboard_check, 'trophy': g_trophy, 'flag': g_flag, 'heart': g_heart,
    'document': g_document, 'lightning': g_lightning, 'arrow_right': g_arrow_right,
    'monitor': g_monitor, 'server': g_server, 'card': g_card, 'layers': g_layers,
}

# which badge color each icon gets, for a bit of palette variety
ACCENT_KEYS = {'star', 'heart', 'trophy', 'rocket', 'lightbulb', 'flag', 'percent', 'alert'}

if __name__ == "__main__":
    for key, fn in GLYPHS.items():
        im = canvas()
        color = ACCENT if key in ACCENT_KEYS else DK2
        d = badge(im, color)
        fn(d)
        im.save(os.path.join(OUT, f"{key}.png"))
    print(f"Generated {len(GLYPHS)} icons in ./{OUT}/")
