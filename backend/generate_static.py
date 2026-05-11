"""
generate_static.py — Generate a fully-static SEO website from the SEO router.

This script crawls all SSR routes using FastAPI's TestClient with
base_url="https://ask.cooking", then writes each rendered HTML file to disk
so the resulting `static_site/` folder can be uploaded directly to GitHub
Pages (or any static hosting provider) — no backend required.

Output:
  /app/backend/static_site/
    ├── index.html              (English home)
    ├── ar/index.html           (Arabic home)
    ├── sv/index.html           (Swedish home)
    ├── recipes/<slug>/index.html
    ├── ar/recipes/<slug>/index.html
    ├── sv/recipes/<slug>/index.html
    ├── categories/<id>/index.html
    ├── sitemap.xml
    ├── robots.txt
    ├── favicon.ico
    ├── static/images/...       (copied recipe images)
    ├── .well-known/apple-app-site-association
    ├── .well-known/assetlinks.json
    ├── CNAME                   ("ask.cooking" for GitHub Pages)
    └── .nojekyll               (skip Jekyll processing on GitHub Pages)

Usage:
    cd /app/backend && python generate_static.py
"""
import os
import sys
import shutil
from pathlib import Path

# Ensure we can import the seo module
sys.path.insert(0, str(Path(__file__).parent))

# Build a minimal FastAPI app that only mounts the SEO router and static files
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.testclient import TestClient

from seo.router import router as seo_router
from seo import slugs as S

ROOT = Path(__file__).parent
OUT = ROOT / "static_site"
IMAGES_DIR = ROOT / "static" / "images"
POSTERS_DIR = ROOT / "static" / "posters"

# Clean previous build
if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir(parents=True)

# Build minimal app
app = FastAPI()
app.include_router(seo_router)
if IMAGES_DIR.exists():
    app.mount("/static/images", StaticFiles(directory=str(IMAGES_DIR)), name="seo_images")

# IMPORTANT: base_url controls request.url.scheme and request.url.netloc inside handlers.
# Setting it to https://ask.cooking makes all generated URLs (canonical, og:image,
# hreflang, sitemap, JSON-LD) point to the production domain.
client = TestClient(app, base_url="https://ask.cooking")


def save_html(url_path: str, html: str) -> None:
    """Save HTML at url_path/index.html so static hosts serve clean URLs."""
    # Strip leading slash
    rel = url_path.lstrip("/")
    if not rel:
        target = OUT / "index.html"
    else:
        target = OUT / rel / "index.html"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(html, encoding="utf-8")


def save_raw(url_path: str, content: str | bytes, *, binary: bool = False) -> None:
    """Save a file at exact url_path (e.g. /sitemap.xml -> static_site/sitemap.xml)."""
    rel = url_path.lstrip("/")
    target = OUT / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    if binary:
        target.write_bytes(content)
    else:
        target.write_text(content, encoding="utf-8")


def crawl(url_path: str, *, raw: bool = False) -> bool:
    """Fetch a path via TestClient and save the response. Return success."""
    try:
        resp = client.get(url_path, follow_redirects=True)
    except Exception as e:
        print(f"  ✗ {url_path} -> EXCEPTION: {e}")
        return False
    if resp.status_code != 200:
        print(f"  ✗ {url_path} -> HTTP {resp.status_code}")
        return False
    if raw:
        save_raw(url_path, resp.text)
    else:
        save_html(url_path, resp.text)
    return True


# ─────────────────────────────────────────────────────────────────────────────
# 1. Load recipe & category data
# ─────────────────────────────────────────────────────────────────────────────
S._ensure_loaded(force=True)
recipes = S.all_recipes()
categories = S.all_categories()
print(f"\nLoaded {len(recipes)} recipes, {len(categories)} categories.\n")

# ─────────────────────────────────────────────────────────────────────────────
# 2. HTML pages
# ─────────────────────────────────────────────────────────────────────────────
ok_count = 0
fail_count = 0

print("→ Home pages (3 locales)")
for lang in ['en', 'ar', 'sv']:
    p = "/" if lang == 'en' else f"/{lang}/"
    print(f"  {p}", end=" ")
    if crawl(p):
        print("✓")
        ok_count += 1
    else:
        fail_count += 1

print(f"\n→ Recipe pages ({len(recipes)} recipes × 3 locales = {len(recipes)*3} pages)")
for r in recipes:
    slug = r.get('slug')
    if not slug:
        continue
    for lang in ['en', 'ar', 'sv']:
        p = f"/recipes/{slug}" if lang == 'en' else f"/{lang}/recipes/{slug}"
        if crawl(p):
            ok_count += 1
        else:
            fail_count += 1

print(f"  → {ok_count} ok, {fail_count} fail so far")

print(f"\n→ Category pages ({len(categories)} categories × 3 locales = {len(categories)*3} pages)")
for c in categories:
    cid = c.get('cat_id') or c.get('id')
    if not cid:
        continue
    for lang in ['en', 'ar', 'sv']:
        p = f"/categories/{cid}" if lang == 'en' else f"/{lang}/categories/{cid}"
        if crawl(p):
            ok_count += 1
        else:
            fail_count += 1

# ─────────────────────────────────────────────────────────────────────────────
# 3. SEO meta files (sitemap.xml, robots.txt) — saved as exact paths
# ─────────────────────────────────────────────────────────────────────────────
print("\n→ SEO meta files")
for path in ["/sitemap.xml", "/robots.txt"]:
    print(f"  {path}", end=" ")
    if crawl(path, raw=True):
        print("✓")
        ok_count += 1
    else:
        fail_count += 1

# ─────────────────────────────────────────────────────────────────────────────
# 4. Universal Link / App Link manifests
# ─────────────────────────────────────────────────────────────────────────────
print("\n→ Universal Link manifests")
for path in ["/.well-known/apple-app-site-association", "/.well-known/assetlinks.json"]:
    print(f"  {path}", end=" ")
    if crawl(path, raw=True):
        print("✓")
        ok_count += 1
    else:
        fail_count += 1

# ─────────────────────────────────────────────────────────────────────────────
# 5. Copy static images so /static/images/* keeps working on GitHub Pages
# ─────────────────────────────────────────────────────────────────────────────
print("\n→ Copying recipe images")
dst_images = OUT / "static" / "images"
if IMAGES_DIR.exists():
    shutil.copytree(IMAGES_DIR, dst_images)
    img_count = sum(1 for _ in dst_images.rglob('*') if _.is_file())
    print(f"  ✓ Copied {img_count} image files to static/images/")

# Also copy a favicon (use logo.png as favicon.ico fallback)
logo = IMAGES_DIR / "logo.png"
if logo.exists():
    shutil.copy(logo, OUT / "favicon.ico")
    print("  ✓ favicon.ico (from logo.png)")

# ─────────────────────────────────────────────────────────────────────────────
# 6. GitHub Pages metadata
# ─────────────────────────────────────────────────────────────────────────────
# CNAME tells GitHub Pages which custom domain to serve
(OUT / "CNAME").write_text("ask.cooking\n")
# .nojekyll prevents GitHub from running Jekyll (we have raw HTML)
(OUT / ".nojekyll").write_text("")
print("  ✓ CNAME (ask.cooking)")
print("  ✓ .nojekyll")

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
total_files = sum(1 for _ in OUT.rglob('*') if _.is_file())
total_size_mb = sum(f.stat().st_size for f in OUT.rglob('*') if f.is_file()) / (1024 * 1024)

print("\n" + "=" * 60)
print(f"  ✅ DONE — Static site generated at: {OUT}")
print(f"  Pages: {ok_count} ok, {fail_count} failed")
print(f"  Files: {total_files} total ({total_size_mb:.1f} MB)")
print("=" * 60)
print("\nNext step: Upload contents of `static_site/` folder to GitHub repo.")
print("Then enable GitHub Pages → connect custom domain ask.cooking")
