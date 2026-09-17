# -*- coding: utf-8 -*-
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Remove inline payment badge rules (old faded style)
BLOCK = re.compile(
    r"\n\s*\.pay-badge\{[^}]*opacity:\.45[^}]*\}[^\n]*\n"
    r"(?:\s*\.pay-badge:hover\{[^}]+\}\s*\n)?"
    r"(?:\s*/\* --- Payment logo styling --- \*/\s*\n)?"
    r"(?:\s*\.pay-badge\{ min-width:64px; text-align:center; \}\s*\n)?"
    r"(?:\s*\.pay-visa\{.*?\}\s*\n)*"
    r"(?:(?:\s*\.pay-paypal.*?\n|\s*\.pp-pay.*?\n|\s*\.pp-pal.*?\n)*)"
    r"(?:\s*\.pay-stripe\{.*?\}\s*\n)?"
    r"(?:\s*\.pay-mastercard\{.*?\}\s*\n)?"
    r"(?:\s*\.mc-circles\{.*?\}\s*\n)?"
    r"(?:\s*\.mc-c1, \.mc-c2\{.*?\}\s*\n)?"
    r"(?:\s*\.mc-c1\{.*?\}\s*\n)?"
    r"(?:\s*\.mc-c2\{.*?\}\s*\n)?"
    r"(?:\s*\.mc-text\{.*?\}\s*\n)?"
    r"(?:\s*\.pay-cod\{.*?\}\s*\n)?",
    re.DOTALL,
)

# Simpler: multiline from .pay-badge{ with opacity through .pay-cod closing
BLOCK2 = re.compile(
    r"  \.pay-badge\{\n.*?  \}\n\n  \.sticky-header-wrap",
    re.DOTALL,
)

BLOCK3 = re.compile(
    r"  \.pay-badge\{\n    background:#F1F2F4;.*?\n  \}\n\n  section\.pad",
    re.DOTALL,
)

SHOP_BLOCK = re.compile(
    r"\.pay-badge\{ background:#F1F2F4;.*?\.pay-cod\{[^\}]+\}\s*\n",
    re.DOTALL,
)

for path in ROOT.glob("*.html"):
    text = path.read_text(encoding="utf-8")
    orig = text
    if "opacity:.45" in text and "pay-badge" in text:
        m = BLOCK2.search(text)
        if m:
            text = text[: m.start()] + "  .sticky-header-wrap" + text[m.end() - len("  .sticky-header-wrap") :]
        m3 = BLOCK3.search(text)
        if m3:
            text = text[: m3.start()] + "  section.pad" + text[m3.end() - len("  section.pad") :]
        text = SHOP_BLOCK.sub("", text)
        # contact/privacy compact blocks
        text = re.sub(
            r"  \.pay-badge\{ background:#F1F2F4; border-radius:6px; padding:\.4rem \.7rem;[^\n]+\n"
            r"  \.pay-badge:hover\{[^\}]+\}\s*\n\s*\n"
            r"  /\* --- Payment logo styling --- \*/\s*\n"
            r"(?:  \.pay-badge\{ min-width:64px; text-align:center; \}\s*\n)?"
            r"(?:  \.pay-[^\{]+\{[^\}]+\}\s*\n|  \.pay-paypal \.pp-[^\{]+\{[^\}]+\}\s*\n|  \.mc-[^\{]+\{[^\}]+\}\s*\n)*",
            "",
            text,
            flags=re.DOTALL,
        )
    if text != orig:
        path.write_text(text, encoding="utf-8")
        print("stripped", path.name)

ppc = ROOT / "assets" / "post-page.css"
pt = ppc.read_text(encoding="utf-8")
pt2 = re.sub(
    r"\.pay-badge\{[^\}]+\}\s*\n\.pay-visa\{[^\}]+\}\s*\n\.pay-paypal[^\n]*\n\.pay-stripe\{[^\}]+\}\s*\n\.pay-mastercard\{[^\}]+\}\s*\n\.mc-circles\{[^\}]+\}\s*\n\.mc-c1,\.mc-c2\{[^\}]+\}\s*\n\.mc-c1\{[^\}]+\}\s*\n\.mc-c2\{[^\}]+\}\s*\n\.pay-cod\{[^\}]+\}\s*\n",
    "",
    pt,
)
if pt2 != pt:
    ppc.write_text(pt2, encoding="utf-8")
    print("stripped post-page.css")
