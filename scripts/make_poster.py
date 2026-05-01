#!/usr/bin/env python3
"""
ASK Poster v4 - Light theme, side screenshots, center text, bottom QR.
A4 Portrait at 300 DPI = 2480x3508 px.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import arabic_reshaper
import qrcode
import os

ASSETS = '/app/poster_assets'
FONTS = os.path.join(ASSETS, 'fonts')

W, H = 2480, 3508

# --- Inverted theme: ivory bg, navy text, gold accents ---
COLOR_BG_TOP = (255, 253, 242)       # warm ivory
COLOR_BG_BOTTOM = (253, 246, 220)    # soft cream
COLOR_NAVY = (20, 32, 72)            # deep navy for main text
COLOR_NAVY_SOFT = (58, 70, 110)      # softer navy for body
COLOR_GOLD = (198, 155, 38)          # gold accent
COLOR_GOLD_DARK = (139, 105, 20)
COLOR_GOLD_LIGHT = (240, 210, 120)
COLOR_BORDER = (218, 175, 60)
COLOR_SHADOW = (0, 0, 0, 110)

def font(path_or_name, size):
    path = os.path.join(FONTS, path_or_name) if not os.path.isabs(path_or_name) else path_or_name
    if not os.path.exists(path):
        path = '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'
    return ImageFont.truetype(path, size)

def ar(text):
    return arabic_reshaper.reshape(text)

def make_bg():
    img = Image.new('RGB', (W, H), COLOR_BG_TOP)
    draw = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        r = int(COLOR_BG_TOP[0] * (1 - t) + COLOR_BG_BOTTOM[0] * t)
        g = int(COLOR_BG_TOP[1] * (1 - t) + COLOR_BG_BOTTOM[1] * t)
        b = int(COLOR_BG_TOP[2] * (1 - t) + COLOR_BG_BOTTOM[2] * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))
    return img

def draw_frame(img):
    draw = ImageDraw.Draw(img)
    m = 55
    # Outer gold line
    draw.rectangle([m, m, W - m, H - m], outline=COLOR_GOLD, width=4)
    # Inner thin line
    draw.rectangle([m + 18, m + 18, W - m - 18, H - m - 18], outline=COLOR_GOLD_LIGHT, width=2)
    # Corner decorations
    corner_size = 80
    for cx, cy, dx, dy in [(m + 18, m + 18, 1, 1), (W - m - 18, m + 18, -1, 1),
                            (m + 18, H - m - 18, 1, -1), (W - m - 18, H - m - 18, -1, -1)]:
        for i in range(4):
            offs = 6 + i * 4
            draw.line([(cx + offs * dx, cy), (cx + offs * dx, cy + corner_size * dy)], fill=COLOR_GOLD, width=2)
            draw.line([(cx, cy + offs * dy), (cx + corner_size * dx, cy + offs * dy)], fill=COLOR_GOLD, width=2)

def draw_divider(draw, y, width_pct=0.6, with_diamond=True):
    margin = int(W * (1 - width_pct) / 2)
    draw.line([(margin, y), (W - margin, y)], fill=COLOR_GOLD, width=2)
    if with_diamond:
        cx = W // 2
        size = 12
        draw.polygon([(cx, y - size), (cx + size, y), (cx, y + size), (cx - size, y)],
                     fill=COLOR_GOLD, outline=COLOR_GOLD_DARK)

def paste_phone(bg, screenshot_path, cx, cy, scale=1.0):
    shot = Image.open(screenshot_path).convert('RGB')
    sw, sh = shot.size
    pw = int(sw * scale)
    ph = int(sh * scale)
    shot = shot.resize((pw, ph), Image.LANCZOS)
    mask = Image.new('L', (pw, ph), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, pw, ph], radius=int(45 * scale), fill=255)
    bez_pad = int(12 * scale)
    bw = pw + bez_pad * 2
    bh = ph + bez_pad * 2
    # Shadow
    sh_img = Image.new('RGBA', (bw + 40, bh + 40), (0, 0, 0, 0))
    ImageDraw.Draw(sh_img).rounded_rectangle([20, 22, bw + 20, bh + 22], radius=int(55 * scale), fill=(0, 0, 0, 90))
    sh_img = sh_img.filter(ImageFilter.GaussianBlur(14))
    bg.paste(sh_img, (cx - bw // 2 - 20, cy - bh // 2 - 10), sh_img)
    # Bezel
    bezel = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))
    ImageDraw.Draw(bezel).rounded_rectangle([0, 0, bw, bh], radius=int(55 * scale), fill=(35, 35, 40, 255))
    bg.paste(bezel, (cx - bw // 2, cy - bh // 2), bezel)
    # Screenshot
    bg.paste(shot, (cx - pw // 2, cy - ph // 2), mask)
    # Gold border inside
    gb = Image.new('RGBA', (pw, ph), (0, 0, 0, 0))
    ImageDraw.Draw(gb).rounded_rectangle([0, 0, pw - 1, ph - 1], radius=int(45 * scale), outline=COLOR_GOLD, width=3)
    bg.paste(gb, (cx - pw // 2, cy - ph // 2), gb)

def make_qr(data, size=500):
    # Use fixed version 4 for consistent box sizes, H-level correction
    qr = qrcode.QRCode(version=4, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color='black', back_color='white').convert('RGBA')
    # Use NEAREST to keep crisp edges (critical for scanning)
    qr_img = qr_img.resize((size, size), Image.NEAREST)
    # Frame with ample white quiet zone
    pad = 20
    framed_w = size + pad * 2
    framed = Image.new('RGBA', (framed_w, framed_w), (255, 255, 255, 255))
    fdraw = ImageDraw.Draw(framed)
    fdraw.rectangle([0, 0, framed_w - 1, framed_w - 1], outline=COLOR_GOLD, width=4)
    framed.paste(qr_img, (pad, pad))
    return framed

def wrap_text(text, font_obj, max_width, draw):
    words = text.split()
    lines = []
    cur = ''
    for w in words:
        test = (cur + ' ' + w).strip()
        bbox = draw.textbbox((0, 0), test, font=font_obj)
        if bbox[2] - bbox[0] <= max_width:
            cur = test
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines

def wrap_arabic(text, font_obj, max_width, draw):
    words = text.split()
    lines = []
    cur = ''
    for w in words:
        test = (cur + ' ' + w).strip()
        t_shaped = ar(test)
        bbox = draw.textbbox((0, 0), t_shaped, font=font_obj)
        if bbox[2] - bbox[0] <= max_width:
            cur = test
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return [ar(l) for l in lines]

# ============ BUILD ============
img = make_bg()
draw_frame(img)
draw = ImageDraw.Draw(img)

# ============ HEADER (compact) ============
y = 120

f_title_ar = font('NotoNaskhArabic-Bold.ttf', 115)
txt_ar = ar('المطبخ الحلبي السوري')
bbox = draw.textbbox((0, 0), txt_ar, font=f_title_ar)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, y), txt_ar, font=f_title_ar, fill=COLOR_NAVY)
y += 145

# Logo + ASK + Logo
logo_path = '/app/frontend/assets/images/logo.png'
logo = Image.open(logo_path).convert('RGBA').resize((140, 140), Image.LANCZOS) if os.path.exists(logo_path) else None
f_ask = font('Playfair-Bold.ttf', 130)
ask_txt = 'A S K'
bbox = draw.textbbox((0, 0), ask_txt, font=f_ask)
aw = bbox[2] - bbox[0]
total_w = 140 + 30 + aw + 30 + 140
x0 = (W - total_w) // 2
if logo:
    img.paste(logo, (x0, y), logo)
    draw.text((x0 + 140 + 30, y + 10), ask_txt, font=f_ask, fill=COLOR_GOLD)
    img.paste(logo, (x0 + 140 + 30 + aw + 30, y), logo)
y += 165

f_sub = font('Playfair-Bold.ttf', 72)
bbox = draw.textbbox((0, 0), 'Aleppo Syrian Kitchen', font=f_sub)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, y), 'Aleppo Syrian Kitchen', font=f_sub, fill=COLOR_NAVY)
y += 100

f_tag = font('NotoNaskhArabic-Regular.ttf', 38)
tag = ar('٧٣ وصفة سورية أصيلة · بثلاث لغات · تراث أم سامر')
bbox = draw.textbbox((0, 0), tag, font=f_tag)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, y), tag, font=f_tag, fill=COLOR_GOLD_DARK)
y += 60

draw_divider(draw, y, 0.6)
y += 45

# ============ MIDDLE: Screenshots LEFT | Center Text | Screenshots RIGHT ============
SHOT_SCALE = 0.95  # Large side screenshots for vertical balance
shot_w = int(390 * SHOT_SCALE)
shot_h = int(844 * SHOT_SCALE)
vertical_gap = 55

left_shots = [
    '/app/poster_assets/shot_home.jpg',      # Categories page with real food photos
    '/app/poster_assets/shot_kebbe.jpg',     # Kebbe Meqleyeh (AR)
]
right_shots = [
    '/app/poster_assets/shot_tabbouleh.jpg', # Tabbouleh (EN)
    '/app/poster_assets/shot_mehshi.jpg',    # Mehshi (SV)
]

side_margin = 80
left_cx = side_margin + shot_w // 2
right_cx = W - side_margin - shot_w // 2
middle_x0 = left_cx + shot_w // 2 + 55
middle_x1 = right_cx - shot_w // 2 - 55

middle_top = y + 10
paste_phone(img, left_shots[0], left_cx, middle_top + shot_h // 2, SHOT_SCALE)
paste_phone(img, left_shots[1], left_cx, middle_top + shot_h + vertical_gap + shot_h // 2, SHOT_SCALE)
paste_phone(img, right_shots[0], right_cx, middle_top + shot_h // 2, SHOT_SCALE)
paste_phone(img, right_shots[1], right_cx, middle_top + shot_h + vertical_gap + shot_h // 2, SHOT_SCALE)

# Center text area
center_w = middle_x1 - middle_x0
center_cx = (middle_x0 + middle_x1) // 2

# Messages - larger, readable
f_msg_ar = font('NotoNaskhArabic-Regular.ttf', 54)
f_msg_en = font('Inter-Regular.ttf', 48) if os.path.exists(os.path.join(FONTS, 'Inter-Regular.ttf')) and os.path.getsize(os.path.join(FONTS, 'Inter-Regular.ttf')) > 0 else font('/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf', 48)

msg_ar = ' أنا سورية سويدية عمري ٦٥ عاما، فكرت قبل أن أفارق هذا العالم أن أفرغ كل حبي وشغفي في الطبخ بخبرة ٥٠ عاما في تطبيق سهل يليق بمحبي تراث الطبخ السوري العريق، ولكي يصل لكل انحاء العالم أنتجته بثلاثة لغات العربية والانجليزية والسويدية عرفانا مني للسويد والجامعة البريطانية التي تخرجت منها وأهلي العرب. حملوا التطبيق من هذا الرابط وابدأوا بالاستمتاع بأطيب الوصفات في العالم'

msg_en = '"I am a Syrian-Swedish woman, 65 years old. Before I leave this world, I decided to pour all my love and passion for cooking — enriched by 50 years of experience — into an easy-to-use app worthy of every lover of the deep-rooted heritage of Syrian cuisine. To let it reach every corner of the world, I have crafted it in three languages: Arabic, English, and Swedish — as a tribute to Sweden, to the British university from which I graduated, and to my Arab family. Download the app from this link and begin savouring the finest recipes in the world."'

msg_sv = '"Jag är en syrisk-svensk kvinna, 65 år gammal. Innan jag lämnar denna värld bestämde jag mig för att hälla all min kärlek och passion för matlagning — berikad av 50 års erfarenhet — i en lättanvänd app värdig varje älskare av det djupt rotade arvet av syrisk matkultur. För att den ska nå varje hörn av världen har jag skapat den på tre språk: arabiska, engelska och svenska — som en hyllning till Sverige, till det brittiska universitetet där jag tog min examen, och till min arabiska familj. Ladda ner appen via denna länk och börja njuta av de finaste recepten i världen."'

line_sp_ar = 76
line_sp_en = 66

cy = middle_top + 30

def draw_lang_tag(yy, text):
    f_lt = font('Playfair-Bold.ttf', 34)
    bbox = draw.textbbox((0, 0), text, font=f_lt)
    tw = bbox[2] - bbox[0]
    pad_x, pad_y = 22, 10
    x0 = center_cx - tw // 2 - pad_x
    x1 = center_cx + tw // 2 + pad_x
    ht = bbox[3] - bbox[1] + 2 * pad_y
    draw.rounded_rectangle([x0, yy, x1, yy + ht], radius=20, fill=(255, 248, 215), outline=COLOR_GOLD, width=2)
    draw.text((center_cx - tw // 2, yy + pad_y), text, font=f_lt, fill=COLOR_GOLD_DARK)
    return yy + ht + 15

# Arabic
cy = draw_lang_tag(cy, 'العربية')
ar_lines = wrap_arabic(msg_ar, f_msg_ar, center_w - 20, draw)
for line in ar_lines:
    bbox = draw.textbbox((0, 0), line, font=f_msg_ar)
    tw = bbox[2] - bbox[0]
    draw.text((center_cx - tw // 2, cy), line, font=f_msg_ar, fill=COLOR_NAVY)
    cy += line_sp_ar
cy += 22

# English
cy = draw_lang_tag(cy, 'English')
en_lines = wrap_text(msg_en, f_msg_en, center_w - 20, draw)
for line in en_lines:
    bbox = draw.textbbox((0, 0), line, font=f_msg_en)
    tw = bbox[2] - bbox[0]
    draw.text((center_cx - tw // 2, cy), line, font=f_msg_en, fill=COLOR_NAVY_SOFT)
    cy += line_sp_en
cy += 22

# Swedish
cy = draw_lang_tag(cy, 'Svenska')
sv_lines = wrap_text(msg_sv, f_msg_en, center_w - 20, draw)
for line in sv_lines:
    bbox = draw.textbbox((0, 0), line, font=f_msg_en)
    tw = bbox[2] - bbox[0]
    draw.text((center_cx - tw // 2, cy), line, font=f_msg_en, fill=COLOR_NAVY_SOFT)
    cy += line_sp_en

shots_bottom = middle_top + shot_h * 2 + vertical_gap
y = max(shots_bottom, cy) + 40

draw_divider(draw, y, 0.7)
y += 60  # Padding before QR section

# ============ FOOTER: QR Codes + Signature ============
# ============ FOOTER: Store badges (replacing QR codes) ============
# Load store badges
APPSTORE_BADGE = Image.open('/app/poster_assets/badges/appstore.png').convert('RGBA')
GOOGLEPLAY_BADGE = Image.open('/app/poster_assets/badges/googleplay.png').convert('RGBA')

BADGE_W = 640
badge_h_as = int(APPSTORE_BADGE.size[1] * BADGE_W / APPSTORE_BADGE.size[0])
badge_h_gp = int(GOOGLEPLAY_BADGE.size[1] * BADGE_W / GOOGLEPLAY_BADGE.size[0])
as_resized = APPSTORE_BADGE.resize((BADGE_W, badge_h_as), Image.LANCZOS)
gp_resized = GOOGLEPLAY_BADGE.resize((BADGE_W, badge_h_gp), Image.LANCZOS)

badge_spacing = 120
badges_total_w = BADGE_W * 2 + badge_spacing
badges_x0 = (W - badges_total_w) // 2
badge_row_h = max(badge_h_as, badge_h_gp)

# Center both badges on same baseline
as_y = y + (badge_row_h - badge_h_as) // 2
gp_y = y + (badge_row_h - badge_h_gp) // 2

img.paste(as_resized, (badges_x0, as_y), as_resized)
img.paste(gp_resized, (badges_x0 + BADGE_W + badge_spacing, gp_y), gp_resized)

# Define clickable regions for PDF hyperlinks
QR_LINKS = [
    (badges_x0, as_y, badges_x0 + BADGE_W, as_y + badge_h_as, 'https://apps.apple.com/app/id6762443271'),
    (badges_x0 + BADGE_W + badge_spacing, gp_y, badges_x0 + BADGE_W + badge_spacing + BADGE_W, gp_y + badge_h_gp, 'https://play.google.com/store/apps/details?id=com.ask.syr'),
]

# URL text below badges
y = y + badge_row_h + 30
f_url = font('Inter-Regular.ttf', 28) if os.path.exists(os.path.join(FONTS, 'Inter-Regular.ttf')) and os.path.getsize(os.path.join(FONTS, 'Inter-Regular.ttf')) > 0 else font('/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', 28)

ios_url = 'apps.apple.com/app/id6762443271'
gp_url = 'play.google.com/store/apps/details?id=com.ask.syr'

# Center each URL under its badge
def center_text_at(x_start, text, font_obj):
    bbox = draw.textbbox((0, 0), text, font=font_obj)
    tw = bbox[2] - bbox[0]
    draw.text((x_start + (BADGE_W - tw) // 2, y), text, font=font_obj, fill=COLOR_NAVY_SOFT)

center_text_at(badges_x0, ios_url, f_url)
center_text_at(badges_x0 + BADGE_W + badge_spacing, gp_url, f_url)
y += 55

draw_divider(draw, y, 0.5)
y += 40

# Signature
f_sig_en = font('Playfair-Bold.ttf', 58)
sig_en = 'Sofia Akkou · Um Samer'
bbox = draw.textbbox((0, 0), sig_en, font=f_sig_en)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, y), sig_en, font=f_sig_en, fill=COLOR_NAVY)
y += 70

f_sig_ar = font('NotoNaskhArabic-Bold.ttf', 52)
sig_ar = ar('صوفيا عكّو · أم سامر')
bbox = draw.textbbox((0, 0), sig_ar, font=f_sig_ar)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, y), sig_ar, font=f_sig_ar, fill=COLOR_GOLD_DARK)
y += 50

# =========== SAVE ===========
png_path = os.path.join(ASSETS, 'ASK_Poster_A4.png')
pdf_path = os.path.join(ASSETS, 'ASK_Poster_A4.pdf')
img.save(png_path, 'PNG', optimize=True)
print(f"✓ PNG: {png_path} ({os.path.getsize(png_path)//1024} KB)")
print(f"Final y={y} (canvas H={H}), overflow={y-H}")

# PDF with clickable hyperlinks using reportlab
from reportlab.pdfgen import canvas as rlc
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader

A4_W, A4_H = A4  # in points (1 inch = 72 pt)
c = rlc.Canvas(pdf_path, pagesize=A4)
c.drawImage(ImageReader(png_path), 0, 0, width=A4_W, height=A4_H)

# Scale pixel coords to A4 points (PDF origin is bottom-left)
sx = A4_W / W
sy = A4_H / H
for (x0, y0, x1, y1, url) in QR_LINKS:
    # In PDF, Y is flipped (bottom origin)
    px0 = x0 * sx
    px1 = x1 * sx
    py1 = (H - y0) * sy  # top of rect in PDF coords
    py0 = (H - y1) * sy  # bottom
    c.linkURL(url, (px0, py0, px1, py1), relative=0, thickness=0)

c.save()
print(f"✓ PDF (with clickable QR links): {pdf_path} ({os.path.getsize(pdf_path)//1024} KB)")
