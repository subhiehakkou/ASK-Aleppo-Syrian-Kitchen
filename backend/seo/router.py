"""
seo/router.py — SEO web routes for ASK.

Mounted at the ROOT of the FastAPI app (NOT under /api/*).
These routes serve:
  • /                         — landing page (English default)
  • /ar/  /sv/                 — landing pages in other locales
  • /recipes/{slug}            — recipe detail page (English)
  • /{lang}/recipes/{slug}     — recipe detail page in other locales
  • /categories/{cat_id}       — category index page
  • /{lang}/categories/{cat_id}
  • /sitemap.xml               — dynamic sitemap (auto-updates as recipes added)
  • /robots.txt
  • /.well-known/apple-app-site-association  — Universal Links (iOS)
  • /.well-known/assetlinks.json             — App Links (Android)

This module DOES NOT touch any /api/* route — the mobile app keeps working unchanged.
"""
from __future__ import annotations
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Optional
from urllib.parse import quote

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse, PlainTextResponse, Response, JSONResponse
from fastapi.templating import Jinja2Templates

from . import constants as C
from . import slugs as S


HERE = Path(__file__).parent
templates = Jinja2Templates(directory=str(HERE / "templates"))

router = APIRouter()

# ---------------------------------------------------------------------------
#  Helpers
# ---------------------------------------------------------------------------

LABELS = {
    'en': {
        'time': 'Time', 'servings': 'Servings', 'category': 'Category',
        'ingredients': 'Ingredients', 'instructions': 'Instructions',
        'secrets': 'Chef\'s Secret', 'decoration': 'Decoration',
        'pro_tips': 'Pro Tips', 'open_in_app': 'Open in ASK App',
        'open_in_app_sub': 'Get the full experience — offline timer, voice mode & more',
        'home_description': 'Authentic Syrian recipes from Aleppo — bulgur, kibbeh, mahshi, tabbouleh and more, in Arabic, English & Swedish. Offline-first cooking app.',
        'categories': 'Recipe Categories',
        'popular_recipes': 'Popular Recipes',
        'category_description': 'All {cat} recipes from Aleppo Syrian Kitchen.',
    },
    'ar': {
        'time': 'الوقت', 'servings': 'عدد الأشخاص', 'category': 'الفئة',
        'ingredients': 'المكونات', 'instructions': 'طريقة التحضير',
        'secrets': 'سر الطباخ', 'decoration': 'التزيين',
        'pro_tips': 'نصائح احترافية', 'open_in_app': 'افتح في تطبيق ASK',
        'open_in_app_sub': 'احصل على التجربة الكاملة — مؤقت يعمل بدون إنترنت، وضع صوتي والمزيد',
        'home_description': 'وصفات سورية أصيلة من حلب — البرغل والكبة والمحاشي والتبولة والمزيد، بالعربية والإنجليزية والسويدية. تطبيق طبخ يعمل بدون إنترنت.',
        'categories': 'فئات الوصفات',
        'popular_recipes': 'وصفات مميّزة',
        'category_description': 'كل وصفات {cat} من المطبخ السوري الحلبي.',
    },
    'sv': {
        'time': 'Tid', 'servings': 'Portioner', 'category': 'Kategori',
        'ingredients': 'Ingredienser', 'instructions': 'Instruktioner',
        'secrets': 'Kockens hemlighet', 'decoration': 'Dekoration',
        'pro_tips': 'Proffstips', 'open_in_app': 'Öppna i ASK-appen',
        'open_in_app_sub': 'Få full upplevelse — offline timer, röstläge och mer',
        'home_description': 'Autentiska syriska recept från Aleppo — bulgur, kibbeh, mahshi, tabbouleh och mer, på arabiska, engelska och svenska. Offline kokbok-app.',
        'categories': 'Receptkategorier',
        'popular_recipes': 'Populära recept',
        'category_description': 'Alla {cat}-recept från Aleppo Syriskt Kök.',
    },
}


def _abs_image_url(filename: Optional[str]) -> str:
    """Build an absolute image URL (used in Schema.org & OG tags)."""
    if not filename:
        return f"{C.PRIMARY_DOMAIN}/static/images/logo.png"
    # Strip any directory prefix
    name = re.sub(r'^.*[/\\]', '', filename)
    return f"{C.PRIMARY_DOMAIN}/static/images/{quote(name)}"


def _path_for_recipe(recipe: dict, lang: str) -> str:
    slug = recipe.get('slug') or S._make_slug(recipe)
    return f"/{lang}/recipes/{slug}" if lang != C.DEFAULT_LOCALE else f"/recipes/{slug}"


def _path_for_category(cat: dict, lang: str) -> str:
    cid = cat.get('cat_id') or cat.get('id', '')
    return f"/{lang}/categories/{cid}" if lang != C.DEFAULT_LOCALE else f"/categories/{cid}"


def _split_lines(text: Optional[str]) -> list[str]:
    """Split a multi-line string into clean list items."""
    if not text:
        return []
    parts = []
    for raw in re.split(r'[\r\n]+', text):
        line = raw.strip().lstrip('•').lstrip('-').lstrip('*').strip()
        if line:
            parts.append(line)
    return parts


def _base_ctx(request: Request, lang: str, canonical_path: str, hreflang_paths: Optional[dict] = None) -> dict:
    """Build the base template context shared across all SSR pages."""
    canonical = f"{C.PRIMARY_DOMAIN}{canonical_path}"
    if hreflang_paths is None:
        # Default: current page in all locales
        hreflang_paths = {l: canonical_path for l in C.LOCALES}
    hreflangs = [{'lang': C.LOCALE_HREFLANG[l], 'url': f"{C.PRIMARY_DOMAIN}{hreflang_paths[l]}"} for l in C.LOCALES]

    def lang_url(target_lang: str) -> str:
        return f"{C.PRIMARY_DOMAIN}{hreflang_paths.get(target_lang, '/')}"

    brand = {'en': C.BRAND_NAME, 'ar': C.BRAND_NAME_AR, 'sv': C.BRAND_NAME_SV}.get(lang, C.BRAND_NAME)
    tagline = {'en': C.BRAND_TAGLINE_EN, 'ar': C.BRAND_TAGLINE_AR, 'sv': C.BRAND_TAGLINE_SV}.get(lang, C.BRAND_TAGLINE_EN)

    return {
        'request': request,
        'lang': lang,
        'canonical_url': canonical,
        'primary_domain': C.PRIMARY_DOMAIN,
        'brand_name': brand,
        'brand_tagline': tagline,
        'hreflangs': hreflangs,
        'lang_url': lang_url,
        'ios_app_id': C.IOS_APP_ID,
        'app_store_url': C.APP_STORE_URL,
        'play_store_url': C.PLAY_STORE_URL,
        'contact_email': C.CONTACT_EMAIL,
        'branch_key': C.BRANCH_KEY,
        'year': datetime.utcnow().year,
        'labels': LABELS.get(lang, LABELS['en']),
    }


def _recipe_url(r: dict, lang: str) -> str:
    return _path_for_recipe(r, lang)


def _recipe_image(r: dict) -> str:
    return _abs_image_url(r.get('image') or r.get('image_path'))


def _recipe_title(r: dict, lang: str) -> str:
    return r.get(f'name_{lang}') or r.get('name_en') or r.get('name_ar') or 'Recipe'


# ---------------------------------------------------------------------------
#  Recipe page
# ---------------------------------------------------------------------------

def _render_recipe(request: Request, slug: str, lang: str) -> HTMLResponse:
    recipe = S.get_recipe(slug)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # localized text
    t = {
        'time': recipe.get(f'time_{lang}') or '',
        'servings': recipe.get(f'servings_{lang}') or '',
        'ingredients': recipe.get(f'ingredients_{lang}') or '',
        'instructions': recipe.get(f'instructions_{lang}') or '',
        'secrets': recipe.get(f'secrets_{lang}') or '',
        'decoration': recipe.get(f'decoration_{lang}') or '',
        'pro_tips': recipe.get(f'pro_tips_{lang}') or '',
    }
    t['ingredients_list'] = _split_lines(t['ingredients'])
    t['instructions_list'] = _split_lines(t['instructions'])

    name = _recipe_title(recipe, lang)
    description = recipe.get(f'description_{lang}') or recipe.get('description_en') or ''
    image_abs = _recipe_image(recipe)

    cat = S.category_by_id(recipe.get('category_id', ''))
    category_name = cat.get(f'name_{lang}') if cat else ''
    category_url = f"{C.PRIMARY_DOMAIN}{_path_for_category(cat, lang)}" if cat else None

    # canonical & hreflang paths
    canonical_path = _path_for_recipe(recipe, lang)
    hreflang_paths = {l: _path_for_recipe(recipe, l) for l in C.LOCALES}

    # ---- Schema.org Recipe JSON-LD ----
    schema = {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        'name': name,
        'image': [image_abs],
        'description': description or f"{name} — {recipe.get('description_en','')}",
        'recipeCuisine': 'Syrian',
        'recipeCategory': cat.get(f'name_{lang}') if cat else 'Main Course',
        'inLanguage': lang,
        'author': {'@type': 'Organization', 'name': C.BRAND_NAME, 'url': C.PRIMARY_DOMAIN},
        'datePublished': '2026-01-01',
        'recipeYield': t['servings'] or None,
        'totalTime': _to_iso_duration(t['time']),
        'recipeIngredient': t['ingredients_list'] or None,
        'recipeInstructions': [
            {'@type': 'HowToStep', 'text': step, 'position': i + 1}
            for i, step in enumerate(t['instructions_list'])
        ] or None,
    }
    schema = {k: v for k, v in schema.items() if v is not None}

    # ---- Deep link URL (Branch.io if configured, else Universal Link) ----
    if C.BRANCH_KEY and C.BRANCH_DOMAIN:
        # Branch link with payload — works for deferred deep linking
        deep_link_url = f"https://{C.BRANCH_DOMAIN}/recipe?id={recipe.get('recipe_id','')}&slug={slug}&lang={lang}"
    else:
        # Direct Universal Link / App Link — same as canonical URL.
        # On iOS/Android with app installed, OS will open the app directly.
        deep_link_url = f"{C.PRIMARY_DOMAIN}{canonical_path}"

    ctx = _base_ctx(request, lang, canonical_path, hreflang_paths)
    ctx.update({
        'recipe': recipe,
        'recipe_name': name,
        'recipe_description': description,
        'recipe_image_abs': image_abs,
        't': t,
        'category_name': category_name,
        'category_url': category_url,
        'deep_link_url': deep_link_url,
        'schema_json': json.dumps(schema, ensure_ascii=False, indent=2),
    })
    return templates.TemplateResponse("recipe.html", ctx)


def _to_iso_duration(s: str) -> Optional[str]:
    """Convert '3 hours' / '45 minutes' / 'ساعة' / etc. to ISO 8601 duration."""
    if not s:
        return None
    txt = s.lower()
    # Find numbers
    nums = re.findall(r'\d+', txt)
    if not nums:
        return None
    n = int(nums[0])
    if any(k in txt for k in ['hour', 'ساعة', 'ساعات', 'tim']):
        return f"PT{n}H"
    if any(k in txt for k in ['min', 'دقيق', 'دقائق', 'minut']):
        return f"PT{n}M"
    return f"PT{n}M"  # fallback to minutes


# ---------------------------------------------------------------------------
#  Routes
# ---------------------------------------------------------------------------

@router.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return _render_home(request, 'en')


@router.get("/ar", response_class=HTMLResponse)
@router.get("/ar/", response_class=HTMLResponse)
async def home_ar(request: Request):
    return _render_home(request, 'ar')


@router.get("/sv", response_class=HTMLResponse)
@router.get("/sv/", response_class=HTMLResponse)
async def home_sv(request: Request):
    return _render_home(request, 'sv')


def _render_home(request: Request, lang: str) -> HTMLResponse:
    canonical = f"/{lang}" if lang != C.DEFAULT_LOCALE else "/"
    hreflang_paths = {'en': '/', 'ar': '/ar', 'sv': '/sv'}
    ctx = _base_ctx(request, lang, canonical, hreflang_paths)
    ctx.update({
        'categories': S.all_categories(),
        'recipes': S.all_recipes(),
        'category_url': lambda c: f"{C.PRIMARY_DOMAIN}{_path_for_category(c, lang)}",
        'recipe_url': lambda r: f"{C.PRIMARY_DOMAIN}{_path_for_recipe(r, lang)}",
        'recipe_image': _recipe_image,
        'recipe_title': lambda r: _recipe_title(r, lang),
        'deep_link_home': f"{C.PRIMARY_DOMAIN}/" if not C.BRANCH_KEY else f"https://{C.BRANCH_DOMAIN or 'app.link'}/",
    })
    return templates.TemplateResponse("home.html", ctx)


@router.get("/recipes/{slug}", response_class=HTMLResponse)
async def recipe_en(request: Request, slug: str):
    return _render_recipe(request, slug, 'en')


@router.get("/{lang}/recipes/{slug}", response_class=HTMLResponse)
async def recipe_lang(request: Request, lang: str, slug: str):
    if lang not in C.LOCALES:
        raise HTTPException(status_code=404)
    return _render_recipe(request, slug, lang)


def _render_category(request: Request, cat_id: str, lang: str) -> HTMLResponse:
    cat = S.category_by_id(cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    recipes = S.recipes_in_category(cat.get('cat_id') or cat.get('id'))
    canonical = _path_for_category(cat, lang)
    hreflang_paths = {l: _path_for_category(cat, l) for l in C.LOCALES}

    ctx = _base_ctx(request, lang, canonical, hreflang_paths)
    name = cat.get(f'name_{lang}') or cat.get('name_en') or cat.get('name_ar')
    ctx.update({
        'category': cat,
        'category_name': name,
        'recipes': recipes,
        'recipe_url': lambda r: f"{C.PRIMARY_DOMAIN}{_path_for_recipe(r, lang)}",
        'recipe_image': _recipe_image,
        'recipe_title': lambda r: _recipe_title(r, lang),
        'deep_link_url': f"{C.PRIMARY_DOMAIN}{canonical}",
    })
    return templates.TemplateResponse("category.html", ctx)


@router.get("/categories/{cat_id}", response_class=HTMLResponse)
async def category_en(request: Request, cat_id: str):
    return _render_category(request, cat_id, 'en')


@router.get("/{lang}/categories/{cat_id}", response_class=HTMLResponse)
async def category_lang(request: Request, lang: str, cat_id: str):
    if lang not in C.LOCALES:
        raise HTTPException(status_code=404)
    return _render_category(request, cat_id, lang)


# ---------------------------------------------------------------------------
#  Sitemap & robots.txt
# ---------------------------------------------------------------------------

@router.get("/sitemap.xml", response_class=Response)
async def sitemap():
    """Dynamic sitemap — automatically includes every recipe + locale variant."""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    urls = []
    # Home in 3 locales
    for lang in C.LOCALES:
        path = "/" if lang == C.DEFAULT_LOCALE else f"/{lang}"
        urls.append((f"{C.PRIMARY_DOMAIN}{path}", today, '1.0', 'weekly'))
    # Categories
    for cat in S.all_categories():
        for lang in C.LOCALES:
            urls.append((f"{C.PRIMARY_DOMAIN}{_path_for_category(cat, lang)}", today, '0.7', 'weekly'))
    # Recipes
    for r in S.all_recipes():
        for lang in C.LOCALES:
            urls.append((f"{C.PRIMARY_DOMAIN}{_path_for_recipe(r, lang)}", today, '0.9', 'monthly'))

    body = ['<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for url, lastmod, prio, freq in urls:
        body.append('  <url>')
        body.append(f'    <loc>{url}</loc>')
        body.append(f'    <lastmod>{lastmod}</lastmod>')
        body.append(f'    <changefreq>{freq}</changefreq>')
        body.append(f'    <priority>{prio}</priority>')
        body.append('  </url>')
    body.append('</urlset>')
    return Response(content='\n'.join(body), media_type="application/xml")


@router.get("/robots.txt", response_class=PlainTextResponse)
async def robots():
    return f"""User-agent: *
Allow: /
Disallow: /api/

Sitemap: {C.PRIMARY_DOMAIN}/sitemap.xml
"""


# ---------------------------------------------------------------------------
#  Apple Universal Links + Android App Links
# ---------------------------------------------------------------------------

@router.get("/.well-known/apple-app-site-association")
async def aasa():
    """Apple Universal Links registration — opens app for /recipes/* and /categories/*."""
    payload = {
        "applinks": {
            "details": [
                {
                    "appIDs": [f"{C.IOS_TEAM_ID}.{C.IOS_BUNDLE_ID}"],
                    "components": [
                        {"/": "/recipes/*"},
                        {"/": "/*/recipes/*"},
                        {"/": "/categories/*"},
                        {"/": "/*/categories/*"},
                        {"/": "/"},
                    ],
                }
            ]
        },
        # webcredentials & activitycontinuation can be added later if needed
    }
    return JSONResponse(content=payload, media_type="application/json")


@router.get("/.well-known/assetlinks.json")
async def assetlinks():
    """Android App Links registration."""
    statements = []
    for fp in C.ANDROID_SHA256_FINGERPRINTS:
        statements.append({
            "relation": ["delegate_permission/common.handle_all_urls"],
            "target": {
                "namespace": "android_app",
                "package_name": C.ANDROID_PACKAGE,
                "sha256_cert_fingerprints": [fp],
            },
        })
    if not statements:
        # No fingerprints registered yet — return empty array (still valid JSON).
        # Will be populated after first Play Store release.
        statements = []
    return JSONResponse(content=statements, media_type="application/json")
