"""Wrap full-bleed soft-bg sections in boxed-panel markup + site-boxed.css link."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
BOXED_LINK = '<link href="assets/site-boxed.css?v=1" rel="stylesheet">\n'

WRAP_CLASSES = (
    "faq-hero",
    "about-hero",
    "policy-hero",
    "category-section",
    "contact-cta",
)

BG_RULES = [
    (
        re.compile(r"(\.faq-hero\{)([^}]*background:[^;]+;)([^}]*\})", re.I),
        r"\1\3",
    ),
    (
        re.compile(r"(\.policy-hero\{)([^}]*background:[^;]+;)([^}]*\})", re.I),
        r"\1\3",
    ),
    (
        re.compile(r"(\.about-hero\{)([^}]*background:[^;]+;)([^}]*\})", re.I),
        r"\1\3",
    ),
    (
        re.compile(
            r"(\.category-section\{)([^}]*background:[^;]+;)([^}]*\})", re.I
        ),
        r"\1\3",
    ),
    (
        re.compile(
            r"(\.contact-cta\{)([^}]*background:[^;]+;)([^}]*\})", re.I
        ),
        r"\1\3",
    ),
    (
        re.compile(
            r"(\.ack-strip\{)([^}]*background:[^;]+;)([^}]*\})", re.I
        ),
        r"\1\3",
    ),
]


def wrap_section(text: str, class_name: str) -> str:
    if f'{class_name} boxed-section-wrap' in text:
        return text
    open_pat = re.compile(
        rf'(<section class="{class_name})([^"]*)"([^>]*>)\s*'
        rf'(?!<div class="boxed-panel">)\s*',
        re.I,
    )
    text, n = open_pat.subn(
        rf'\1 boxed-section-wrap\2"\3\n  <div class="boxed-panel">\n    ',
        text,
        count=1,
    )
    if not n:
        return text
    close_pat = re.compile(
        rf'(<section class="{class_name} boxed-section-wrap"[^>]*>.*?)(</section>)',
        re.I | re.S,
    )

    def close_repl(m: re.Match[str]) -> str:
        body, end = m.group(1), m.group(2)
        if body.rstrip().endswith("</div>"):
            return body + "\n  </div>\n" + end
        return m.group(0)

    return close_pat.sub(close_repl, text, count=1)


def wrap_ack_strip(text: str) -> str:
    if "ack-strip boxed-section-wrap" in text:
        return text
    pat = re.compile(
        r'<div class="ack-strip">\s*(.*?)\s*</div>\s*(?=<!-- Footer -->)',
        re.I | re.S,
    )

    def repl(m: re.Match[str]) -> str:
        inner = m.group(1).strip()
        return (
            '<div class="ack-strip boxed-section-wrap">\n'
            '  <div class="boxed-panel">\n'
            f"    {inner}\n"
            "  </div>\n"
            "</div>\n\n"
        )

    return pat.sub(repl, text, count=1)


def strip_bg_rules(text: str) -> str:
    for pat, repl in BG_RULES:
        text = pat.sub(repl, text)
    text = re.sub(
        r"(\.(?:faq-hero|policy-hero|about-hero|category-section|contact-cta)\{)\s*padding:[^;]+;\s*",
        r"\1 ",
        text,
    )
    text = re.sub(
        r"(\.ack-strip\{)\s*padding:[^;]+;\s*",
        r"\1 ",
        text,
    )
    for cls in ("faq-hero", "policy-hero", "about-hero"):
        text = re.sub(
            rf"(\.{cls}\{{)\s*\}}",
            rf"\1 padding:0; text-align:center; }}",
            text,
            count=1,
        )
    text = re.sub(
        r"(\.about-hero\{)[^}]*text-align:center[^}]*\}",
        r"\1 padding:0; }",
        text,
        count=1,
    )
    text = re.sub(
        r"(\.contact-cta\{)\s*\}",
        r"\1 padding:0; }",
        text,
        count=1,
    )
    text = re.sub(r"(\.ack-strip\{)\s*\}", r"\1 padding:0; }", text, count=1)
    text = re.sub(
        r"(\.category-section\{)\s*\}",
        r"\1 padding:0; }",
        text,
        count=1,
    )
    return text


def add_link(text: str) -> str:
    if "site-boxed.css" in text:
        return text
    if re.search(r'<link href="assets/site-header\.css[^"]*"', text):
        return re.sub(
            r'(<link href="assets/site-header\.css[^"]*" rel="stylesheet">\n?)',
            r"\1" + BOXED_LINK,
            text,
            count=1,
        )
    if "</head>" in text:
        return text.replace("</head>", BOXED_LINK + "</head>", 1)
    return text


def transform(text: str) -> str:
    if "sticky-header-wrap" not in text:
        return text
    for cls in WRAP_CLASSES:
        text = wrap_section(text, cls)
    if "ack-strip" in text:
        text = wrap_ack_strip(text)
    text = strip_bg_rules(text)
    text = add_link(text)
    return text


def main() -> None:
    updated = []
    for path in sorted(ROOT.glob("*.html")):
        if path.name.startswith("_"):
            continue
        try:
            raw = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        new = transform(raw)
        if new != raw:
            path.write_text(new, encoding="utf-8")
            updated.append(path.name)
    print("Updated:", ", ".join(updated) if updated else "(none)")


if __name__ == "__main__":
    main()
