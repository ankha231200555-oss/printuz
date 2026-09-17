import json, re
from pathlib import Path
posts = json.loads(Path("blog/posts.json").read_text(encoding="utf-8"))
p = next(x for x in posts if x["id"] == "tuyen-dung-printuz-ltd")
html = p.get("contentHtml", "")
Path("_tmp_recruit_snip.txt").write_text(html[:2500], encoding="utf-8")
