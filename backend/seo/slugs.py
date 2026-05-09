"""
slugs.py — recipe slug generation & lookup.

Stable, SEO-friendly URL slugs for each recipe:
  • Based on English transliterated name (lowercase, hyphenated)
  • Deterministic — given the same recipe name, always produces the same slug
  • If the English name is missing/empty, falls back to Arabic transliterated
  • A central in-memory index maps slug → recipe so URLs stay permanent
    even if the recipes JSON is reloaded.

Key promise to Ms Sabah:
  Once a recipe is published with slug "kebbe-meqlyieh", that URL
  https://ask.cooking/recipes/kebbe-meqlyieh stays valid FOREVER —
  cloud-agnostic, host-agnostic, never breaks.
"""
from __future__ import annotations
import json
import os
import threading
from pathlib import Path
from typing import Optional

from slugify import slugify

# Path to the canonical recipes data (also used by the mobile app)
RECIPES_JSON = Path('/app/frontend/src/data/recipes.json')
CATEGORIES_JSON = Path('/app/frontend/src/data/categories.json')

# In-memory cache (rebuilt on demand)
_lock = threading.Lock()
_recipes_by_slug: dict[str, dict] = {}
_recipes_list: list[dict] = []
_categories_list: list[dict] = []
_loaded = False
_mtime = 0.0


def _make_slug(recipe: dict) -> str:
    """Build a stable URL-friendly slug for a recipe."""
    # Prefer English name → Latin slug
    en = (recipe.get('name_en') or '').strip()
    if en:
        s = slugify(en, lowercase=True, max_length=80)
        if s:
            return s
    # Fallback: Arabic name → transliterated
    ar = (recipe.get('name_ar') or '').strip()
    if ar:
        s = slugify(ar, lowercase=True, max_length=80)
        if s:
            return s
    # Last-resort: recipe_id
    return f"recipe-{recipe.get('recipe_id', 'unknown')}"


def _ensure_loaded(force: bool = False) -> None:
    """Lazily load (and reload on file change) the recipes index."""
    global _loaded, _mtime, _recipes_by_slug, _recipes_list, _categories_list
    try:
        cur_mtime = RECIPES_JSON.stat().st_mtime
    except OSError:
        cur_mtime = 0.0
    with _lock:
        if _loaded and not force and cur_mtime == _mtime:
            return
        # Reload
        try:
            with open(RECIPES_JSON, 'r', encoding='utf-8') as f:
                recipes = json.load(f)
        except Exception:
            recipes = []
        try:
            with open(CATEGORIES_JSON, 'r', encoding='utf-8') as f:
                _categories_list = json.load(f)
        except Exception:
            _categories_list = []

        _recipes_by_slug = {}
        for r in recipes:
            slug = _make_slug(r)
            # Handle dup-slug collision by appending recipe_id
            if slug in _recipes_by_slug:
                slug = f"{slug}-{r.get('recipe_id', '')}"
            r['slug'] = slug
            _recipes_by_slug[slug] = r
        _recipes_list = recipes
        _loaded = True
        _mtime = cur_mtime


def get_recipe(slug: str) -> Optional[dict]:
    _ensure_loaded()
    return _recipes_by_slug.get(slug)


def all_recipes() -> list[dict]:
    _ensure_loaded()
    return _recipes_list


def all_categories() -> list[dict]:
    _ensure_loaded()
    return _categories_list


def category_by_id(cat_id: str) -> Optional[dict]:
    _ensure_loaded()
    for c in _categories_list:
        if c.get('cat_id') == cat_id or c.get('id') == cat_id:
            return c
    return None


def recipes_in_category(cat_id: str) -> list[dict]:
    _ensure_loaded()
    out = []
    for r in _recipes_list:
        if r.get('category_id') == cat_id or cat_id in (r.get('category_ids') or []):
            out.append(r)
    return out
