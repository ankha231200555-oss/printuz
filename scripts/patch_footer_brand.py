import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FOOTER_BRAND = """<a href="index.html" class="site-brand site-brand--footer mb-3" aria-label="Printuz Fulfillment">
          <img src="assets/logo-mark.png?v=1" alt="" class="logo-mark" width="40" height="40">
          <span class="site-brand-text">
            <span class="site-brand-name">PRINTUZ</span>
            <span class="site-brand-tag">FULFILLMENT</span>
          </span>
        </a>"""

pat_png = re.compile(
    r'<img src="assets/logo\.png\?v=\d+" alt="Printuz Fulfillment" class="footer-logo mb-3">'
)
pat_b64 = re.compile(
    r'<img src="data:image/png;base64,[^"]+" alt="Printuz Fulfillment" class="footer-logo mb-3">'
)

for html in ROOT.glob("*.html"):
    text = html.read_text(encoding="utf-8")
    new, n1 = pat_png.subn(FOOTER_BRAND, text)
    new, n2 = pat_b64.subn(FOOTER_BRAND, new)
    if n1 or n2:
        html.write_text(new, encoding="utf-8")
        print(html.name, "png", n1, "b64", n2)
