#!/usr/bin/env python3
"""
Generate A4 poster for ASK - Aleppo Syrian Kitchen app.
Outputs:
 - /app/poster_assets/ASK_Poster_A4.png  (for social media / digital)
 - /app/poster_assets/ASK_Poster_A4.pdf  (for print, 300 DPI)

A4 @ 300 DPI = 2480 x 3508 px
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import arabic_reshaper
from bidi.algorithm import get_display
import qrcode
import os

ASSETS = '/app/poster_assets'
FONTS = os.path.join(ASSETS, 'fonts')

# A4 at 300 DPI (portrait)
W, H = 2480, 3508

# Theme colors (golden & ivory)
COLOR_BG_TOP = (10, 14, 40)        # Deep navy
COLOR_BG_MID = (28, 22, 60)        # Royal purple-blue
COLOR_BG_BOTTOM = (15, 30, 55)     # Dark teal blue
COLOR_IVORY = (255, 255, 240)
COLOR_GOLD = (255, 215, 0)
COLOR_GOLD_DARK = (198, 155, 38)
COLOR_GOLD_LIGHT = (255, 235, 135)
COLOR_TEXT_DARK = (34, 34, 34)
COLOR_TEXT_LIGHT = (250, 245, 220)
COLOR_CREAM = (255, 252, 225)

# Fonts
def font(path_or_name, size):
    path = os.path.join(FONTS, path_or_name) if not os.path.isabs(path_or_name) else path_or_name
    if not os.path.exists(path):
        path = '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'
    return ImageFont.truetype(path, size)

# Arabic text helper
def ar(text):
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)

# Create base image with vertical gradient
def make_gradient_bg():
    img = Image.new('RGB', (W, H), COLOR_BG_TOP)
    draw = ImageDraw.Draw(img)
    # Gradient from top to bottom
    for y in range(H):
        t = y / H
        if t < 0.5:
            a = t * 2
            r = int(COLOR_BG_TOP[0] * (1 - a) + COLOR_BG_MID[0] * a)
            g = int(COLOR_BG_TOP[1] * (1 - a) + COLOR_BG_MID[1] * a)
            b = int(COLOR_BG_TOP[2] * (1 - a) + COLOR_BG_MID[2] * a)
        else:
            a = (t - 0.5) * 2
            r = int(COLOR_BG_MID[0] * (1 - a) + COLOR_BG_BOTTOM[0] * a)
            g = int(COLOR_BG_MID[1] * (1 - a) + COLOR_BG_BOTTOM[1] * a)
            b = int(COLOR_BG_MID[2] * (1 - a) + COLOR_BG_BOTTOM[2] * a)
        draw.line([(0, y), (W, y)], fill=(r, g, b))
    return img

# Golden decorative frame
def draw_border(img):
    draw = ImageDraw.Draw(img)
    # Outer golden border
    margin = 50
    for i in range(6):
        draw.rectangle([margin + i, margin + i, W - margin - i, H - margin - i],
                       outline=COLOR_GOLD, width=1)
    # Inner thin
    inner_margin = 70
    draw.rectangle([inner_margin, inner_margin, W - inner_margin, H - inner_margin],
                   outline=COLOR_GOLD_DARK, width=2)

# Decorative horizontal line with diamond
def draw_gold_divider(draw, y, width_pct=0.7, with_diamond=True):
    margin = int(W * (1 - width_pct) / 2)
    # Gradient line (simulated with alpha fade)
    for x in range(margin, W - margin):
        t = (x - margin) / (W - 2 * margin)
        alpha = 1 - abs(t - 0.5) * 2
        shade = int(200 * alpha)
        if shade > 0:
            c = (min(255, COLOR_GOLD[0]), min(255, COLOR_GOLD[1]), 0)
            draw.line([(x, y), (x, y + 2)], fill=c)
    if with_diamond:
        # Diamond in center
        cx = W // 2
        size = 15
        diamond = [(cx, y - size), (cx + size, y), (cx, y + size), (cx - size, y)]
        draw.polygon(diamond, fill=COLOR_GOLD, outline=COLOR_GOLD_DARK)


def paste_phone_frame(bg, screenshot_path, cx, cy, scale=1.0):
    """Paste a screenshot with a simulated phone-frame look."""
    shot = Image.open(screenshot_path).convert('RGB')
    # Phone dimensions - scale
    sw, sh = shot.size
    phone_w = int(sw * scale)
    phone_h = int(sh * scale)
    shot = shot.resize((phone_w, phone_h), Image.LANCZOS)
    # Create rounded corners mask
    mask = Image.new('L', (phone_w, phone_h), 0)
    mdraw = ImageDraw.Draw(mask)
    corner = int(45 * scale)
    mdraw.rounded_rectangle([0, 0, phone_w, phone_h], radius=corner, fill=255)
    # Create phone bezel
    bezel_pad = int(14 * scale)
    bezel_w = phone_w + bezel_pad * 2
    bezel_h = phone_h + bezel_pad * 2
    bezel = Image.new('RGBA', (bezel_w, bezel_h), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(bezel)
    # Shadow
    shadow = Image.new('RGBA', (bezel_w + 40, bezel_h + 40), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle([20, 25, bezel_w + 20, bezel_h + 25], radius=corner + bezel_pad, fill=(0, 0, 0, 180))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    # Paste shadow
    x = cx - bezel_w // 2 - 20
    y = cy - bezel_h // 2 - 5
    bg.paste(shadow, (x, y), shadow)
    # Paste bezel (black rounded rect)
    bdraw.rounded_rectangle([0, 0, bezel_w, bezel_h], radius=corner + bezel_pad, fill=(28, 28, 30, 255))
    bg.paste(bezel, (cx - bezel_w // 2, cy - bezel_h // 2), bezel)
    # Paste screenshot with mask
    bg.paste(shot, (cx - phone_w // 2, cy - phone_h // 2), mask)
    # Gold border inside
    gb = Image.new('RGBA', (phone_w, phone_h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gb)
    gd.rounded_rectangle([0, 0, phone_w - 1, phone_h - 1], radius=corner, outline=COLOR_GOLD, width=3)
    bg.paste(gb, (cx - phone_w // 2, cy - phone_h // 2), gb)


def make_qr_code(data, size=550, fg='#1A1A2E', bg='white', label_text=None):
    """Create a QR code with optional label; return PIL image."""
    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=20, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color=fg, back_color=bg).convert('RGBA')
    img = img.resize((size, size), Image.NEAREST)
    # Add golden frame
    framed = Image.new('RGBA', (size + 30, size + 30), (255, 250, 230, 255))
    fdraw = ImageDraw.Draw(framed)
    fdraw.rounded_rectangle([0, 0, size + 29, size + 29], radius=20, fill=(255, 252, 225, 255))
    fdraw.rounded_rectangle([0, 0, size + 29, size + 29], radius=20, outline=COLOR_GOLD, width=4)
    framed.paste(img, (15, 15))
    return framed


def draw_centered_text(draw, text, y, font_obj, fill, max_w=None):
    """Draw centered text horizontally, return new y."""
    bbox = draw.textbbox((0, 0), text, font=font_obj)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (W - tw) // 2
    draw.text((x, y), text, font=font_obj, fill=fill)
    return y + th


def wrap_text(text, font_obj, max_width, draw):
    """Wrap text into lines that fit max_width."""
    words = text.split()
    lines = []
    current = ''
    for w in words:
        test = (current + ' ' + w).strip()
        bbox = draw.textbbox((0, 0), test, font=font_obj)
        if bbox[2] - bbox[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = w
    if current:
        lines.append(current)
    return lines


def wrap_arabic(text, font_obj, max_width, draw):
    """Wrap Arabic text. Treat as words split by spaces, then reshape+bidi per line."""
    words = text.split()
    lines = []
    current = ''
    for w in words:
        test = (current + ' ' + w).strip()
        bidi_test = ar(test)
        bbox = draw.textbbox((0, 0), bidi_test, font=font_obj)
        if bbox[2] - bbox[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = w
    if current:
        lines.append(current)
    # Return bidi'd lines
    return [ar(l) for l in lines]


# ============ BUILD POSTER ============

img = make_gradient_bg()
draw_border(img)
draw = ImageDraw.Draw(img)

# -------- HEADER --------
y = 140

# Top small divider
draw_gold_divider(draw, y, width_pct=0.5)
y += 60

# App Name (Arabic)
f_title_ar = font('NotoNaskhArabic-Bold.ttf', 130)
text = ar('المطبخ الحلبي السوري')
bbox = draw.textbbox((0, 0), text, font=f_title_ar)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, y), text, font=f_title_ar, fill=COLOR_GOLD)
y += 160

# A S K logo + letters
logo_path = '/app/frontend/assets/images/logo.png'
if os.path.exists(logo_path):
    logo = Image.open(logo_path).convert('RGBA')
    logo = logo.resize((180, 180), Image.LANCZOS)
    ask_text = 'A S K'
    f_ask = font('Playfair-Bold.ttf', 160)
    bbox = draw.textbbox((0, 0), ask_text, font=f_ask)
    aw = bbox[2] - bbox[0]
    gap = 40
    total_w = 180 + gap + aw + gap + 180
    x0 = (W - total_w) // 2
    img.paste(logo, (x0, y), logo)
    draw.text((x0 + 180 + gap, y + 20), ask_text, font=f_ask, fill=COLOR_GOLD)
    img.paste(logo, (x0 + 180 + gap + aw + gap, y), logo)
    y += 200

# Subtitle Aleppo Syrian Kitchen
f_sub = font('Playfair-Bold.ttf', 90)
draw_centered_text(draw, 'Aleppo Syrian Kitchen', y, f_sub, COLOR_GOLD)
y += 120

# Tagline
f_tag = font('NotoNaskhArabic-Regular.ttf', 55)
tagline = ar('٧٣ وصفة سورية أصيلة · بثلاث لغات · تراث أم سامر')
bbox = draw.textbbox((0, 0), tagline, font=f_tag)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, y), tagline, font=f_tag, fill=COLOR_GOLD_LIGHT)
y += 90

# Divider
draw_gold_divider(draw, y, width_pct=0.6)
y += 80

# -------- SCREENSHOTS GRID 2x2 --------
# Each screenshot: scale from 390x844 to fit ~420x910
SHOT_SCALE = 1.08  # 390 -> ~421 wide; 844 -> ~911 tall

shots = [
    '/app/poster_assets/shot_welcome.jpg',
    '/app/poster_assets/shot_home.jpg',
    '/app/poster_assets/shot_kebbe.jpg',
    '/app/poster_assets/shot_tabbouleh.jpg',
]

# Grid positions
col_gap = 180
row_gap = 80
shot_w_scaled = int(390 * SHOT_SCALE)
shot_h_scaled = int(844 * SHOT_SCALE)
bezel_extra = 30
cell_w = shot_w_scaled + bezel_extra
grid_w = cell_w * 2 + col_gap
grid_x0 = (W - grid_w) // 2
grid_y0 = y + 40
cx1 = grid_x0 + cell_w // 2
cx2 = grid_x0 + cell_w + col_gap + cell_w // 2
cy_row1 = grid_y0 + shot_h_scaled // 2
cy_row2 = grid_y0 + shot_h_scaled + row_gap + shot_h_scaled // 2

positions = [(cx1, cy_row1), (cx2, cy_row1), (cx1, cy_row2), (cx2, cy_row2)]

for path, (cx, cy) in zip(shots, positions):
    paste_phone_frame(img, path, cx, cy, scale=SHOT_SCALE)

y = cy_row2 + shot_h_scaled // 2 + 70

# Divider
draw_gold_divider(draw, y, width_pct=0.7)
y += 75

# -------- HEARTFELT MESSAGE (3 languages) --------
draw = ImageDraw.Draw(img)
f_msg_ar = font('NotoNaskhArabic-Regular.ttf', 40)
f_msg_en = font('Inter-Regular.ttf', 36) if os.path.exists(os.path.join(FONTS, 'Inter-Regular.ttf')) and os.path.getsize(os.path.join(FONTS, 'Inter-Regular.ttf')) > 0 else font('/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf', 36)
f_msg_sv = f_msg_en

msg_ar = ' أنا سورية سويدية عمري ٦٥ عاما، فكرت قبل أن أفارق هذا العالم أن أفرغ كل حبي وشغفي في الطبخ بخبرة ٥٠ عاما في تطبيق سهل يليق بمحبي تراث الطبخ السوري العريق، ولكي يصل لكل انحاء العالم أنتجته بثلاثة لغات العربية والانجليزية والسويدية عرفانا مني للسويد والجامعة البريطانية التي تخرجت منها وأهلي العرب. حملوا التطبيق من هذا الرابط وابدأوا بالاستمتاع بأطيب الوصفات في العالم'

msg_en = '"I am a Syrian-Swedish woman, 65 years old. Before I leave this world, I decided to pour all my love and passion for cooking — enriched by 50 years of experience — into an easy-to-use app worthy of every lover of the deep-rooted heritage of Syrian cuisine. To let it reach every corner of the world, I have crafted it in three languages: Arabic, English, and Swedish — as a tribute to Sweden, to the British university from which I graduated, and to my Arab family. Download the app from this link and begin savouring the finest recipes in the world."'

msg_sv = '"Jag är en syrisk-svensk kvinna, 65 år gammal. Innan jag lämnar denna värld bestämde jag mig för att hälla all min kärlek och passion för matlagning — berikad av 50 års erfarenhet — i en lättanvänd app värdig varje älskare av det djupt rotade arvet av syrisk matkultur. För att den ska nå varje hörn av världen har jag skapat den på tre språk: arabiska, engelska och svenska — som en hyllning till Sverige, till det brittiska universitetet där jag tog min examen, och till min arabiska familj. Ladda ner appen via denna länk och börja njuta av de finaste recepten i världen."'

text_max_w = W - 400  # margins
line_spacing_ar = 62
line_spacing_en = 50

# Arabic first
ar_lines = wrap_arabic(msg_ar, f_msg_ar, text_max_w, draw)
for line in ar_lines:
    bbox = draw.textbbox((0, 0), line, font=f_msg_ar)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, y), line, font=f_msg_ar, fill=COLOR_IVORY)
    y += line_spacing_ar
y += 35

# Small diamond separator
draw_gold_divider(draw, y, width_pct=0.35)
y += 55

# English
en_lines = wrap_text(msg_en, f_msg_en, text_max_w, draw)
for line in en_lines:
    bbox = draw.textbbox((0, 0), line, font=f_msg_en)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, y), line, font=f_msg_en, fill=COLOR_TEXT_LIGHT)
    y += line_spacing_en
y += 35

draw_gold_divider(draw, y, width_pct=0.35)
y += 55

# Swedish
sv_lines = wrap_text(msg_sv, f_msg_sv, text_max_w, draw)
for line in sv_lines:
    bbox = draw.textbbox((0, 0), line, font=f_msg_sv)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, y), line, font=f_msg_sv, fill=COLOR_GOLD_LIGHT)
    y += line_spacing_en
y += 40

# -------- QR CODES + DOWNLOAD BUTTONS --------
APP_STORE_URL = 'https://apps.apple.com/app/id6762443271'
PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.ask.syr'

qr_size = 420
qr_ios = make_qr_code(APP_STORE_URL, size=qr_size)
qr_android = make_qr_code(PLAY_STORE_URL, size=qr_size)

qr_y = y + 30
qr_total_w = qr_size * 2 + 200 + 60 * 2
left_x = (W - qr_total_w) // 2
img.paste(qr_ios, (left_x, qr_y), qr_ios)
img.paste(qr_android, (left_x + qr_size + 200 + 60, qr_y), qr_android)

# Labels under QR codes
f_qr_label = font('Playfair-Bold.ttf', 58)
f_qr_label_ar = font('NotoNaskhArabic-Bold.ttf', 48)

label_y = qr_y + qr_size + 40

# iPhone icon + text
draw.text((left_x, label_y), 'App Store', font=f_qr_label, fill=COLOR_GOLD)
bbox = draw.textbbox((0, 0), 'App Store', font=f_qr_label)
as_w = bbox[2] - bbox[0]
text_ar_ios = ar('للآيفون والآيباد')
bbox = draw.textbbox((0, 0), text_ar_ios, font=f_qr_label_ar)
arw = bbox[2] - bbox[0]
draw.text((left_x + (qr_size + 30 - arw) // 2, label_y + 70), text_ar_ios, font=f_qr_label_ar, fill=COLOR_GOLD_LIGHT)

# Google Play
gp_x = left_x + qr_size + 200 + 60
draw.text((gp_x, label_y), 'Google Play', font=f_qr_label, fill=COLOR_GOLD)
text_ar_an = ar('لأجهزة الأندرويد')
bbox = draw.textbbox((0, 0), text_ar_an, font=f_qr_label_ar)
arw2 = bbox[2] - bbox[0]
draw.text((gp_x + (qr_size + 30 - arw2) // 2, label_y + 70), text_ar_an, font=f_qr_label_ar, fill=COLOR_GOLD_LIGHT)

y = label_y + 190

# Call to action
f_cta = font('NotoNaskhArabic-Bold.ttf', 62)
cta_ar = ar('امسح الكود أو اضغط على الرابط للتحميل')
bbox = draw.textbbox((0, 0), cta_ar, font=f_cta)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, y), cta_ar, font=f_cta, fill=COLOR_GOLD)
y += 90

f_cta_en = font('Playfair-Bold.ttf', 48)
cta_en = 'Scan the QR code or tap the link to download'
bbox = draw.textbbox((0, 0), cta_en, font=f_cta_en)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, y), cta_en, font=f_cta_en, fill=COLOR_IVORY)
y += 100

# Divider
draw_gold_divider(draw, y, width_pct=0.5)
y += 55

# -------- SIGNATURE --------
f_sig_name = font('Playfair-Bold.ttf', 78)
sig_en = 'Sofia Akkou · Um Samer'
draw_centered_text(draw, sig_en, y, f_sig_name, COLOR_GOLD)
y += 100

f_sig_ar = font('NotoNaskhArabic-Bold.ttf', 72)
sig_ar = ar('صوفيا عكّو · أم سامر')
bbox = draw.textbbox((0, 0), sig_ar, font=f_sig_ar)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, y), sig_ar, font=f_sig_ar, fill=COLOR_GOLD_LIGHT)
y += 90

# Final small divider
draw_gold_divider(draw, y, width_pct=0.3)

# ========= SAVE =========
png_path = os.path.join(ASSETS, 'ASK_Poster_A4.png')
pdf_path = os.path.join(ASSETS, 'ASK_Poster_A4.pdf')
img.save(png_path, 'PNG', optimize=True)
print(f"✓ PNG saved: {png_path} ({os.path.getsize(png_path)//1024} KB)")

# Save as PDF (A4 @ 300 DPI)
img.save(pdf_path, 'PDF', resolution=300)
print(f"✓ PDF saved: {pdf_path} ({os.path.getsize(pdf_path)//1024} KB)")
