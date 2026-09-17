import json, re
from pathlib import Path
root = Path(__file__).resolve().parents[1]
posts = json.loads((root / "blog" / "posts.json").read_text(encoding="utf-8"))
for pid in [
    "cach-syns-product-va-order-tu-cac-san-khac-ve-printuz-bang-extension",
    "tuyen-dung-printuz-ltd",
]:
    p = next(x for x in posts if x["id"] == pid)
    imgs = re.findall(r'<img[^>]+src="([^"]+)"', p.get("contentHtml") or "")
    out = root / f"_imgs_{pid[:15]}.txt"
    out.write_text("\n".join(imgs[:10]) or "(none)", encoding="utf-8")
