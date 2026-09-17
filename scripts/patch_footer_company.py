import pathlib

root = pathlib.Path(__file__).resolve().parents[1]
logo_old = 'width="40" height="40"'
logo_new = 'width="56" height="56"'
block_old = """        <div class="fw-bold mb-1">Printuz LTD</div>
        <div class="text-muted mb-3" style="font-size:.9rem;">Fulfillment &amp; E-Commerce Solutions</div>
        <div class="fw-bold mb-1" style="font-size:.85rem; letter-spacing:.06em;">ADDRESS</div>
        <p class="footer-address mb-2">
          73, 4C Street, Dai Phuc Residential Area,<br>
          Binh Hung Commune, Binh Chanh District,<br>
          Ho Chi Minh City, Vietnam
        </p>
        <a href="mailto:Contact@Printuz.com">Contact@Printuz.com</a>"""
block_new = """        <div class="footer-company-name">Printuz LTD</div>
        <div class="footer-company-tagline">Fulfillment &amp; E-Commerce Solutions</div>
        <div class="footer-address-label">ADDRESS</div>
        <p class="footer-address mb-2">
          73, 4C Street, Dai Phuc Residential Area,<br>
          Binh Hung Commune, Binh Chanh District,<br>
          Ho Chi Minh City, Vietnam
        </p>
        <a class="footer-contact-email" href="mailto:Contact@Printuz.com">Contact@Printuz.com</a>"""

for p in root.rglob("*.html"):
    t = p.read_text(encoding="utf-8")
    if "site-brand--footer" not in t:
        continue
    orig = t
    t = t.replace(logo_old, logo_new)
    t = t.replace(block_old, block_new)
    t = t.replace("site-header-frame.css?v=5", "site-header-frame.css?v=6")
    if t != orig:
        p.write_text(t, encoding="utf-8")
        print("updated", p.relative_to(root))

py = root / "scripts" / "gen_post_shell.py"
if py.exists():
    t = py.read_text(encoding="utf-8")
    t2 = t.replace(block_old, block_new).replace(logo_old, logo_new)
    if t2 != t:
        py.write_text(t2, encoding="utf-8")
        print("updated scripts/gen_post_shell.py")
