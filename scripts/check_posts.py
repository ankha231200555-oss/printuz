import json
from pathlib import Path
root = Path(__file__).resolve().parents[1]
posts = json.loads((root / "blog" / "posts.json").read_text(encoding="utf-8"))
for pid in [
    "tuyen-dung-printuz-ltd",
    "cach-syns-product-va-order-tu-cac-san-khac-ve-printuz-bang-extension",
]:
    x = next((i for i in posts if i["id"] == pid), None)
    out = {"id": pid, "found": bool(x)}
    if x:
        out.update(
            {
                "title": x["title"],
                "date": x["date"],
                "authorSlug": x.get("authorSlug"),
                "categoryLabel": x.get("categoryLabel"),
                "contentLen": len(x.get("contentHtml") or ""),
            }
        )
    (root / f"_meta_{pid[:20]}.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8"
    )
