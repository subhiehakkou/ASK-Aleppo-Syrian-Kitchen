"""
constants.py — central SEO/branding constants shared across templates & routes.
"""

# ===== Domain & branding =====
PRIMARY_DOMAIN = "https://ask.cooking"
BRAND_NAME = "ASK - Aleppo Syrian Kitchen"
BRAND_NAME_AR = "المطبخ السوري الحلبي"
BRAND_NAME_SV = "Aleppo Syriskt Kök"
BRAND_TAGLINE_EN = "Authentic Syrian recipes from Aleppo"
BRAND_TAGLINE_AR = "نكهات الأصالة من حلب - سوريا"
BRAND_TAGLINE_SV = "Autentiska syriska recept från Aleppo"

CONTACT_EMAIL = "askmalmo@gmail.com"
LOGO_URL = "/static/images/logo.png"

# ===== App store IDs =====
IOS_APP_ID = "6762443271"
IOS_BUNDLE_ID = "com.ask.syr"
IOS_TEAM_ID = "H4BK37FNXQ"
ANDROID_PACKAGE = "com.ask.syr"
# SHA256 fingerprints for Android App Links (will be populated after Play upload).
# Multiple entries supported — debug + release.
ANDROID_SHA256_FINGERPRINTS: list[str] = [
    # placeholder — to be filled with real release-key fingerprint after Play submission
]

APP_STORE_URL = f"https://apps.apple.com/app/id{IOS_APP_ID}"
PLAY_STORE_URL = f"https://play.google.com/store/apps/details?id={ANDROID_PACKAGE}"

# ===== Deep link schemes =====
APP_SCHEME = "askkitchen"
APP_HOST = "ask.cooking"

# ===== Branch.io =====
# Will be set via env BRANCH_KEY after Ms Sabah creates the Branch account.
# When not set, the SSR pages still work (without deferred deep linking).
import os
BRANCH_KEY = os.environ.get('BRANCH_KEY', '')
BRANCH_DOMAIN = os.environ.get('BRANCH_DOMAIN', '')  # e.g. askkitchen.app.link

# ===== Locales =====
LOCALES = ['en', 'ar', 'sv']
LOCALE_NAMES = {
    'en': 'English',
    'ar': 'العربية',
    'sv': 'Svenska',
}
LOCALE_HREFLANG = {
    'en': 'en',
    'ar': 'ar',
    'sv': 'sv',
}
DEFAULT_LOCALE = 'en'
