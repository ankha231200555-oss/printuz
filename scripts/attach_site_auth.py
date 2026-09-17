from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNIPPET = (
    '<link rel="stylesheet" href="assets/site-auth.css?v=1">\n'
    '<script src="assets/site-auth.js?v=1" defer></script>'
)

PAGES = [
    "index.html",
    "shop.html",
    "news.html",
    "contact.html",
    "privacy.html",
    "extension.html",
    "recruit.html",
    "about.html",
    "my-account.html",
    "reset-password.html",
]

for name in PAGES:
    path = ROOT / name
    if not path.exists():
        continue
    html = path.read_text(encoding="utf-8")
    if "site-auth.js" in html:
        print("skip", name)
        continue
    if "</head>" in html:
        html = html.replace("</head>", SNIPPET + "\n</head>", 1)
    else:
        html = SNIPPET + "\n" + html
    path.write_text(html, encoding="utf-8")
    print("patched", name)
