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
    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=20, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color=(20, 32, 72), back_color='white').convert('RGBA')
    qr_img = qr_img.resize((size, size), Image.NEAREST)
    framed = Image.new('RGBA', (size + 30, size + 30), (255, 255, 255, 255))
    fdraw = ImageDraw.Draw(framed)
    fdraw.rounded_rectangle([0, 0, size + 29, size + 29], radius=15, fill=(255, 255, 255, 255))
    fdraw.rounded_rectangle([0, 0, size + 29, size + 29], radius=15, outline=COLOR_GOLD, width=4)
    framed.paste(qr_img, (15, 15))
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

# ============ SCREENSHOTS ROW (4 side by side) ============
SHOT_SCALE = 0.62  # 390 -> 242; 844 -> 523
shot_w = int(390 * SHOT_SCALE)
shot_h = int(844 * SHOT_SCALE)

shots = [
    '/app/poster_assets/shot_welcome.jpg',
    '/app/poster_assets/shot_home.jpg',
    '/app/poster_assets/shot_kebbe.jpg',
    '/app/poster_assets/shot_tabbouleh.jpg',
]

margin_sides = 150
avail_w = W - margin_sides * 2
gap = (avail_w - shot_w * 4) // 3
row_cy = y + shot_h // 2 + 10
for i, path in enumerate(shots):
    cx = margin_sides + shot_w // 2 + i * (shot_w + gap)
    paste_phone(img, path, cx, row_cy, SHOT_SCALE)

y = row_cy + shot_h // 2 + 50

draw_divider(draw, y, 0.6)
y += 55

# ============ MIDDLE: Full-width messages (big, readable) ============
f_msg_ar = font('NotoNaskhArabic-Regular.ttf', 54)
f_msg_en = font('Inter-Regular.ttf', 48) if os.path.exists(os.path.join(FONTS, 'Inter-Regular.ttf')) and os.path.getsize(os.path.join(FONTS, 'Inter-Regular.ttf')) > 0 else font('/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf', 48)

msg_ar = ' أنا سورية سويدية عمري ٦٥ عاما، فكرت قبل أن أفارق هذا العالم أن أفرغ كل حبي وشغفي في الطبخ بخبرة ٥٠ عاما في تطبيق سهل يليق بمحبي تراث الطبخ السوري العريق، ولكي يصل لكل انحاء العالم أنتجته بثلاثة لغات العربية والانجليزية والسويدية عرفانا مني للسويد والجامعة البريطانية التي تخرجت منها وأهلي العرب. حملوا التطبيق من هذا الرابط وابدأوا بالاستمتاع بأطيب الوصفات في العالم'

msg_en = '"I am a Syrian-Swedish woman, 65 years old. Before I leave this world, I decided to pour all my love and passion for cooking — enriched by 50 years of experience — into an easy-to-use app worthy of every lover of the deep-rooted heritage of Syrian cuisine. To let it reach every corner of the world, I have crafted it in three languages: Arabic, English, and Swedish — as a tribute to Sweden, to the British university from which I graduated, and to my Arab family. Download the app from this link and begin savouring the finest recipes in the world."'

msg_sv = '"Jag är en syrisk-svensk kvinna, 65 år gammal. Innan jag lämnar denna värld bestämde jag mig för att hälla all min kärlek och passion för matlagning — berikad av 50 års erfarenhet — i en lättanvänd app värdig varje älskare av det djupt rotade arvet av syrisk matkultur. För att den ska nå varje hörn av världen har jag skapat den på tre språk: arabiska, engelska och svenska — som en hyllning till Sverige, till det brittiska universitetet där jag tog min examen, och till min arabiska familj. Ladda ner appen via denna länk och börja njuta av de finaste recepten i världen."'

text_max_w = W - 260
line_sp_ar = 76
line_sp_en = 64
center_cx = W // 2

def draw_lang_tag(y, text):
    f_lt = font('Playfair-Bold.ttf', 36)
    bbox = draw.textbbox((0, 0), text, font=f_lt)
    tw = bbox[2] - bbox[0]
    pad_x, pad_y = 22, 10
    x0 = center_cx - tw // 2 - pad_x
    x1 = center_cx + tw // 2 + pad_x
    ht = bbox[3] - bbox[1] + 2 * pad_y
    draw.rounded_rectangle([x0, y, x1, y + ht], radius=20, fill=(255, 248, 215), outline=COLOR_GOLD, width=2)
    draw.text((center_cx - tw // 2, y + pad_y), text, font=f_lt, fill=COLOR_GOLD_DARK)
    return y + ht + 15

# Arabic
y = draw_lang_tag(y, 'العربية')
ar_lines = wrap_arabic(msg_ar, f_msg_ar, text_max_w, draw)
for line in ar_lines:
    bbox = draw.textbbox((0, 0), line, font=f_msg_ar)
    tw = bbox[2] - bbox[0]
    draw.text((center_cx - tw // 2, y), line, font=f_msg_ar, fill=COLOR_NAVY)
    y += line_sp_ar
y += 20

# English
y = draw_lang_tag(y, 'English')
en_lines = wrap_text(msg_en, f_msg_en, text_max_w, draw)
for line in en_lines:
    bbox = draw.textbbox((0, 0), line, font=f_msg_en)
    tw = bbox[2] - bbox[0]
    draw.text((center_cx - tw // 2, y), line, font=f_msg_en, fill=COLOR_NAVY_SOFT)
    y += line_sp_en
y += 20

# Swedish
y = draw_lang_tag(y, 'Svenska')
sv_lines = wrap_text(msg_sv, f_msg_en, text_max_w, draw)
for line in sv_lines:
    bbox = draw.textbbox((0, 0), line, font=f_msg_en)
    tw = bbox[2] - bbox[0]
    draw.text((center_cx - tw // 2, y), line, font=f_msg_en, fill=COLOR_NAVY_SOFT)
    y += line_sp_en
y += 40

draw_divider(draw, y, 0.7)
y += 55

# ============ FOOTER: QR Codes + Signature ============
qr_size = 340
qr_ios = make_qr('https://apps.apple.com/app/id6762443271', size=qr_size)
qr_android = make_qr('https://play.google.com/store/apps/details?id=com.ask.syr', size=qr_size)

qr_spacing = 160
qr_total_w = qr_size * 2 + qr_spacing + 60
qr_left_x = (W - qr_total_w) // 2
qr_y = y

img.paste(qr_ios, (qr_left_x, qr_y), qr_ios)
img.paste(qr_android, (qr_left_x + qr_size + qr_spacing + 30, qr_y), qr_android)

f_qr_label = font('Playfair-Bold.ttf', 48)
f_qr_label_ar = font('NotoNaskhArabic-Bold.ttf', 40)

label_y = qr_y + qr_size + 35

def label_qr(x_start, title_en, title_ar):
    bbox = draw.textbbox((0, 0), title_en, font=f_qr_label)
    tw = bbox[2] - bbox[0]
    draw.text((x_start + (qr_size + 30 - tw) // 2, label_y), title_en, font=f_qr_label, fill=COLOR_NAVY)
    bbox2 = draw.textbbox((0, 0), title_ar, font=f_qr_label_ar)
    tw2 = bbox2[2] - bbox2[0]
    draw.text((x_start + (qr_size + 30 - tw2) // 2, label_y + 60), title_ar, font=f_qr_label_ar, fill=COLOR_GOLD_DARK)

label_qr(qr_left_x, 'App Store', ar('للآيفون والآيباد'))
label_qr(qr_left_x + qr_size + qr_spacing + 30, 'Google Play', ar('لأجهزة الأندرويد'))

y = label_y + 130

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
img.save(pdf_path, 'PDF', resolution=300)
print(f"✓ PDF: {pdf_path} ({os.path.getsize(pdf_path)//1024} KB)")
