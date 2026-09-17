import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BRAND = '''<a href="index.html" class="site-brand" aria-label="Printuz Fulfillment">
      <img src="assets/logo-mark.png?v=1" alt="" class="logo-mark" width="46" height="46">
      <span class="site-brand-text">
        <span class="site-brand-name">PRINTUZ</span>
        <span class="site-brand-tag">FULFILLMENT</span>
      </span>
    </a>'''

pat = re.compile(
    r'<a href="index\.html">\s*'
    r'<img src="assets/logo\.png\?v=\d+" alt="Printuz Fulfillment" class="logo-img">\s*'
    r'</a>',
    re.MULTILINE,
)

for html in ROOT.glob("*.html"):
    text = html.read_text(encoding="utf-8")
    new, n = pat.subn(BRAND, text)
    if n:
        html.write_text(new, encoding="utf-8")
        print(html.name, n)
