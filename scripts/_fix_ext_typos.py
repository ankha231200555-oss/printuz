from pathlib import Path

root = Path(__file__).resolve().parents[1]
p = root / "assets" / "extension-body.html"
t = p.read_text(encoding="utf-8")
repls = [
    ("Paste Token của abjn vào", "Paste Token của bạn vào"),
    ("bạn sẽ tháy nút", "bạn sẽ thấy nút"),
    (" , phí trên cùng bên phải", " , phía trên cùng bên phải"),
]
for a, b in repls:
    if a not in t:
        raise SystemExit("missing: " + a)
    t = t.replace(a, b)
p.write_text(t, encoding="utf-8")
print("patched body")
