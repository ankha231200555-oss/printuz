import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
files = [
    "index.html",
    "about.html",
    "contact.html",
    "news.html",
    "privacy.html",
    "shop.html",
    "faq.html",
    "extension.html",
    "recruit.html",
    "reset-password.html",
    "my-account.html",
]
open_pat = re.compile(
    r'(<div class="top-strip">PRINTUZ LTD</div>\s*\n\s*<div class="sticky-header-wrap">)',
    re.M,
)
close_pat = re.compile(
    r'(</nav>\s*\n</div>\s*\n)(<div class="sticky-spacer")',
    re.M,
)
link = '<link href="assets/site-header-frame.css?v=1" rel="stylesheet">'

for name in files:
    p = root / name
    text = p.read_text(encoding="utf-8")
    if "site-header-frame" not in text:
        text2, n1 = open_pat.subn(r'<div class="site-header-frame">\n\1', text, count=1)
        if n1 != 1:
            raise SystemExit(f"{name}: open wrap failed ({n1})")
        text2, n2 = close_pat.subn(r"\1</div>\n\2", text2, count=1)
        if n2 != 1:
            raise SystemExit(f"{name}: close wrap failed ({n2})")
        text = text2
    if "site-header-frame.css" not in text:
        if "site-back-top.css" in text:
            text = text.replace(
                '<link href="assets/site-back-top.css?v=1" rel="stylesheet">',
                link + "\n" + '<link href="assets/site-back-top.css?v=1" rel="stylesheet">',
                1,
            )
        elif re.search(r'site-footer-pay\.css', text):
            text = re.sub(
                r'(<link href="assets/site-footer-pay\.css[^"]*" rel="stylesheet">)',
                r"\1\n" + link,
                text,
                count=1,
            )
        elif 'href="assets/post-page.css"' in text:
            text = text.replace(
                '<link href="assets/post-page.css" rel="stylesheet">',
                '<link href="assets/post-page.css" rel="stylesheet">\n' + link,
                1,
            )
        else:
            raise SystemExit(f"{name}: could not insert css link")
    p.write_text(text, encoding="utf-8")
    print("patched", name)
