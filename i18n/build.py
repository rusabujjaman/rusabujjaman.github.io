"""Make bn/index.html and ru/index.html from index.html.

Run from the repo root:  python3 i18n/build.py
Edit English text in index.html and its translations in i18n/translations.py,
then run this again so all three languages stay the same.
"""
import html, os, re, sys

sys.path.insert(0, os.path.dirname(__file__))
from translations import T

SITE = "https://rusabujjaman.github.io/"
src = open("index.html", encoding="utf-8").read()


def build(lang):
    h = src
    missing = []
    for en in sorted(T, key=len, reverse=True):
        tx = T[en][lang]
        found = False
        for form in {en, html.escape(en, quote=False), en.replace("'", "&#39;"), en.replace("'", "&rsquo;")}:
            # text between tags
            pat = re.compile(r">(\s*)" + re.escape(form) + r"(\s*)<")
            h, n = pat.subn(lambda m: ">" + m.group(1) + html.escape(tx, quote=False) + m.group(2) + "<", h)
            found |= n > 0
            # translatable attributes
            pat = re.compile(r'((?:content|alt|aria-label|title)=")' + re.escape(form) + '"')
            h, n = pat.subn(lambda m: m.group(1) + html.escape(tx) + '"', h)
            found |= n > 0
            # strings inside the page script
            pat = re.compile(r"'" + re.escape(form) + r"'")
            h, n = pat.subn(lambda m: "'" + tx.replace("'", "\\'") + "'", h)
            found |= n > 0
        if not found:
            missing.append(en)

    # language, links and paths for a page one folder deep
    h = h.replace('<html lang="en">', f'<html lang="{lang}">', 1)
    h = h.replace(f'<link rel="canonical" href="{SITE}">', f'<link rel="canonical" href="{SITE}{lang}/">')
    h = h.replace(f'<meta property="og:url" content="{SITE}">', f'<meta property="og:url" content="{SITE}{lang}/">')
    h = h.replace('aria-current="page">EN<', '>EN<')
    h = h.replace(f'hreflang="{lang}">', f'hreflang="{lang}" aria-current="page">', 1)
    h = re.sub(r'(src|href)="(images/|videos/|content\.js|qa/)', r'\1="../\2', h)
    h = h.replace('href="cv/Rusab-Hazra-CV.pdf"', f'href="../cv/Rusab-Hazra-CV-{lang}.pdf"')
    h = h.replace('<script src="../content.js"></script>', '<script>window.BASE="../"</script>\n<script src="../content.js"></script>', 1)

    os.makedirs(lang, exist_ok=True)
    open(f"{lang}/index.html", "w", encoding="utf-8").write(h)
    return missing


for lang in ("bn", "ru"):
    miss = build(lang)
    print(lang, "built;", "not found:" if miss else "all text translated", miss or "")
