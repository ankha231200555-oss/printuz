import json
from pathlib import Path

posts = json.loads(Path("blog/posts.json").read_text(encoding="utf-8"))
print("total", len(posts))
print("--- first 12 ---")
for p in posts[:12]:
    print(repr(p["id"][:80]), "|", p["title"][:90], "|", p["date"])

needles = [
    "Замыслы",
    "эстетичного",
    "Что приготовить",
    "ночного",
    "Предложения",
    "импровизированного",
    "домашнего утреннего",
    "просмотра картины",
]
print("--- search ---")
for n in needles:
    hits = [p for p in posts if n.lower() in (p.get("title") or "").lower()]
    print(n, len(hits))
    for p in hits[:3]:
        print(" ", p["id"][:120], "|", p["title"])

print("--- encoded ids ---")
enc = [p for p in posts if "%" in (p.get("id") or "")]
print("percent ids", len(enc))
for p in enc[:8]:
    print(" ", p["id"][:120], "|", p["title"][:80])

print("--- cyrillic ids ---")
cyr = [p for p in posts if any("\u0400" <= ch <= "\u04ff" for ch in (p.get("id") or ""))]
print("cyrillic ids", len(cyr))
for p in cyr[:8]:
    print(" ", p["id"][:120], "|", p["title"][:80])
