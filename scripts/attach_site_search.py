from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LINK = '<link rel="stylesheet" href="assets/site-search.css">'
SCRIPT = '<script src="assets/site-search.js" defer></script>'
SNIPPET = LINK + "\n" + SCRIPT

PAGES = [
    "index.html",
    "shop.html",
    "news.html",
    "contact.html",
    "privacy.html",
    "extension.html",
    "recruit.html",
    "about.html",
]

for name in PAGES:
    path = ROOT / name
    if not path.exists():
        continue
    html = path.read_text(encoding="utf-8")
    if "site-search.js" in html:
        print("skip", name)
        continue
    if "</head>" in html:
        html = html.replace("</head>", SNIPPET + "\n</head>", 1)
    else:
        html = SNIPPET + "\n" + html
    path.write_text(html, encoding="utf-8")
    print("patched", name)
