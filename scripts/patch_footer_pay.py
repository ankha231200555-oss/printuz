# -*- coding: utf-8 -*-
"""Apply shared footer payment badges markup across HTML pages."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LINK = '<link href="assets/site-footer-pay.css?v=1" rel="stylesheet">\n'

PAY_BLOCK = """      <div class="footer-pay-badges">
        <span class="pay-badge pay-visa">VISA</span>
        <span class="pay-badge pay-paypal"><span class="pp-pay">Pay</span><span class="pp-pal">Pal</span></span>
        <span class="pay-badge pay-stripe">stripe</span>
        <span class="pay-badge pay-mastercard"><span class="mc-circles"><span class="mc-c1"></span><span class="mc-c2"></span></span><span class="mc-text">MasterCard</span></span>
        <span class="pay-badge pay-cod">CASH ON<br>DELIVERY</span>
      </div>"""

import re

PAY_INNER = re.compile(
    r'<div class="(?:d-flex gap-2 flex-wrap|footer-pay-badges)">.*?</div>\s*(?=</div>\s*</div>\s*</footer>)',
    re.DOTALL,
)

FILES = [
    "index.html",
    "about.html",
    "contact.html",
    "privacy.html",
    "shop.html",
    "news.html",
    "faq.html",
    "extension.html",
    "recruit.html",
    "my-account.html",
    "reset-password.html",
]

for name in FILES:
    path = ROOT / name
    if not path.exists():
        continue
    text = path.read_text(encoding="utf-8")
    if "pay-badge pay-visa" in text or name in ("my-account.html", "reset-password.html"):
        if PAY_INNER.search(text):
            text = PAY_INNER.sub(PAY_BLOCK + "\n", text, count=1)
        elif "Copyright 2026" in text and "pay-badge" not in text:
            text = text.replace(
                "      <div>Copyright 2026 © <strong>Printuz ltd</strong></div>\n    </div>",
                "      <div>Copyright 2026 © <strong>Printuz ltd</strong></div>\n"
                + PAY_BLOCK
                + "\n    </div>",
                1,
            )
    if "site-footer-pay.css" not in text:
        if '<link href="assets/post-page.css"' in text:
            text = text.replace(
                '<link href="assets/post-page.css" rel="stylesheet">',
                '<link href="assets/post-page.css" rel="stylesheet">\n' + LINK.strip(),
                1,
            )
        elif "</head>" in text and "bootstrap" in text:
            text = text.replace("</head>", LINK + "</head>", 1)
    path.write_text(text, encoding="utf-8")
    print("patched", name)
