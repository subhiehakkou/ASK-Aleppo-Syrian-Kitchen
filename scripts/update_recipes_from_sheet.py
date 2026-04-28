"""
Update /app/frontend/src/data/recipes.json from the Excel sheet.
- Match by Arabic name (normalized)
- Preserve existing `id` (UUID), `category_id`, `image` from current JSON
- Add new `description_ar`, `description_en`, `description_sv` fields
- Update name_en, name_sv, time, ingredients, instructions, servings, decoration, secrets
- Recipes in JSON but not in sheet are dropped (73 final)
- Recipes in sheet but not in JSON are added (none expected)
"""
import openpyxl, json, re, os

SHEET = '/tmp/sheet/recipes.xlsx'
JSON_PATH = '/app/frontend/src/data/recipes.json'
OUT_PATH = JSON_PATH
BACKUP = JSON_PATH + '.bak'

def norm(s):
    if not s: return ''
    return re.sub(r'\s+', '', str(s)).strip()

# Backup
if not os.path.exists(BACKUP):
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        orig = f.read()
    with open(BACKUP, 'w', encoding='utf-8') as f:
        f.write(orig)
    print(f"Backup saved: {BACKUP}")

with open(JSON_PATH, 'r', encoding='utf-8') as f:
    current = json.load(f)

# Build lookup by normalized AR name (fallback prefix)
def find_existing(ar_name):
    n = norm(ar_name)
    for r in current:
        if norm(r.get('name_ar')) == n:
            return r
    # prefix fallback
    for r in current:
        rn = norm(r.get('name_ar'))
        if rn and (rn.startswith(n[:15]) or n.startswith(rn[:15])):
            return r
    return None

wb = openpyxl.load_workbook(SHEET, data_only=True)
ws = wb.active

# Col index map (1-based from earlier inspection)
COL = {
    'cat_ar': 2, 'name_ar': 3, 'desc_ar': 4, 'time_ar': 5, 'ing_ar': 6, 'way_ar': 7,
    'shares_ar': 8, 'dec_ar': 9, 'sec_ar': 10, 'img_ar': 11,
    'cat_en': 17, 'name_en': 18, 'desc_en': 19, 'time_en': 20, 'ing_en': 21, 'way_en': 22,
    'shares_en': 23, 'dec_en': 24, 'sec_en': 25,
    'cat_sv': 32, 'name_sv': 33, 'desc_sv': 34, 'time_sv': 35, 'ing_sv': 36, 'way_sv': 37,
    'shares_sv': 38, 'dec_sv': 39, 'sec_sv': 40,
}

def cell(r, key):
    v = ws.cell(row=r, column=COL[key]).value
    if v is None: return ''
    return str(v).strip()

output = []
stats = {'matched': 0, 'new': 0, 'dropped': 0}

for row in range(2, ws.max_row + 1):
    ar_name = cell(row, 'name_ar')
    if not ar_name:
        continue
    existing = find_existing(ar_name)
    if existing:
        stats['matched'] += 1
        r = dict(existing)  # copy
    else:
        stats['new'] += 1
        import uuid
        r = {
            'id': str(uuid.uuid4()),
            'recipe_id': str(row - 1),
            'category_id': 'Ass',  # fallback
            'image': '',
        }
    # Update from sheet
    r['name_ar'] = ar_name
    r['name_en'] = cell(row, 'name_en')
    r['name_sv'] = cell(row, 'name_sv')
    # NEW description fields
    r['description_ar'] = cell(row, 'desc_ar')
    r['description_en'] = cell(row, 'desc_en')
    r['description_sv'] = cell(row, 'desc_sv')
    # Standard fields
    r['time_ar'] = cell(row, 'time_ar')
    r['time_en'] = cell(row, 'time_en')
    r['time_sv'] = cell(row, 'time_sv')
    r['ingredients_ar'] = cell(row, 'ing_ar')
    r['ingredients_en'] = cell(row, 'ing_en')
    r['ingredients_sv'] = cell(row, 'ing_sv')
    r['instructions_ar'] = cell(row, 'way_ar')
    r['instructions_en'] = cell(row, 'way_en')
    r['instructions_sv'] = cell(row, 'way_sv')
    r['servings_ar'] = cell(row, 'shares_ar')
    r['servings_en'] = cell(row, 'shares_en')
    r['servings_sv'] = cell(row, 'shares_sv')
    r['decoration_ar'] = cell(row, 'dec_ar')
    r['decoration_en'] = cell(row, 'dec_en')
    r['decoration_sv'] = cell(row, 'dec_sv')
    r['secrets_ar'] = cell(row, 'sec_ar')
    r['secrets_en'] = cell(row, 'sec_en')
    r['secrets_sv'] = cell(row, 'sec_sv')
    # Keep existing image if sheet image path matches existing
    # image is kept from existing entry.
    # pro_tips left as is (always null in sheet)
    r.setdefault('pro_tips_ar', None)
    r.setdefault('pro_tips_en', None)
    r.setdefault('pro_tips_sv', None)
    r.setdefault('video_link', None)
    # recipe_id: use row-1
    r['recipe_id'] = str(row - 1)
    output.append(r)

# Track dropped
sheet_ar = set(norm(cell(r, 'name_ar')) for r in range(2, ws.max_row+1))
for rec in current:
    if norm(rec.get('name_ar')) not in sheet_ar:
        # check prefix fallback
        n = norm(rec.get('name_ar'))
        found = False
        for s in sheet_ar:
            if s and (s.startswith(n[:15]) or n.startswith(s[:15])):
                found = True
                break
        if not found:
            stats['dropped'] += 1
            print(f"  DROPPED: {rec.get('name_ar')}")

with open(OUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n=== STATS ===")
print(f"Matched (updated): {stats['matched']}")
print(f"New (added): {stats['new']}")
print(f"Dropped: {stats['dropped']}")
print(f"Total written: {len(output)}")
print(f"Output: {OUT_PATH}")
