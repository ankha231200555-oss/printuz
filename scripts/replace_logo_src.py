import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOGO = '<img src="assets/logo.png?v=1" alt="Printuz Fulfillment" class="logo-img">'
pat = re.compile(
    r'<img src="(?:data:image/png;base64,[^"]+|assets/logo\.png(?:\?v=\d+)?)" '
    r'alt="Printuz Fulfillment" class="logo-img">'
)

for html in ROOT.glob("*.html"):
    text = html.read_text(encoding="utf-8")
    new, n = pat.subn(LOGO, text)
    if n:
        html.write_text(new, encoding="utf-8")
        print(html.name, n)
