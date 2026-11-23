"""Make cv/Rusab-Hazra-CV.pdf (English), -bn.pdf and -ru.pdf from i18n/cv.html.
Run from the repo root:  python3 i18n/build_cv.py   (needs: pip install playwright)
"""
import html, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from translations import T
from cv_extra import C
from playwright.sync_api import sync_playwright

D = {**T, **C}
root = os.path.abspath(os.path.dirname(__file__))
src = open(os.path.join(root, "cv.html"), encoding="utf-8").read()
fonts = "".join(
    f'@font-face{{font-family:"Hind Siliguri";font-weight:{w};src:url("fonts/hind-siliguri-bengali-{w}-normal.woff2")}}'
    for w in (400, 600, 700))
src = src.replace("<style>", "<style>" + fonts, 1).replace(
    'font-family:Inter,"Helvetica Neue",Arial,sans-serif', 'font-family:Inter,"Hind Siliguri","Helvetica Neue",Arial,sans-serif')


def tr(lang):
    h = src
    for en in sorted(D, key=len, reverse=True):
        tx = html.escape(D[en][lang], quote=False)
        for form in {en, html.escape(en, quote=False)}:
            h = re.sub(r">(\s*)" + re.escape(form) + r"(\s*)<", lambda m: ">" + m.group(1) + tx + m.group(2) + "<", h)
    return h.replace('<html>', f'<html lang="{lang}">', 1)


os.makedirs("cv", exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch()
    for lang, name in (("en", "Rusab-Hazra-CV.pdf"), ("bn", "Rusab-Hazra-CV-bn.pdf"), ("ru", "Rusab-Hazra-CV-ru.pdf")):
        page_html = src if lang == "en" else tr(lang)
        tmp = os.path.join(root, f"_cv_{lang}.html")
        open(tmp, "w", encoding="utf-8").write(page_html)
        pg = b.new_page()
        pg.goto("file://" + tmp)
        pg.wait_for_timeout(600)
        pg.pdf(path=f"cv/{name}", format="A4", print_background=True)
        pg.close()
        os.remove(tmp)
        print("made cv/" + name)
    b.close()
