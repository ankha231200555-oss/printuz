import json, re
from pathlib import Path
root = Path(__file__).resolve().parents[1]
posts = json.loads((root / "blog" / "posts.json").read_text(encoding="utf-8"))
pid = "cach-syns-product-va-order-tu-cac-san-khac-ve-printuz-bang-extension"
p = next(x for x in posts if x["id"] == pid)
html = p.get("contentHtml") or ""
(root / "_extension_content.html").write_text(html, encoding="utf-8")
imgs = re.findall(r'<img[^>]+src="([^"]+)"', html)
(root / "_extension_imgs.txt").write_text("\n".join(f"{i+1}. {u}" for i, u in enumerate(imgs)), encoding="utf-8")
print("imgs", len(imgs), "html len", len(html))
