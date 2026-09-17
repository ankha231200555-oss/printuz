import re, base64
from pathlib import Path
root = Path(__file__).resolve().parents[1]
html = (root / "index.html").read_text(encoding="utf-8")
m = re.search(r'src="data:image/png;base64,([^"]+)"', html)
if not m:
    raise SystemExit("logo not found")
out = root / "assets" / "logo.png"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_bytes(base64.b64decode(m.group(1)))
print("wrote", out)
