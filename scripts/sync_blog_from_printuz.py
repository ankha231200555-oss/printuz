"""
Download all blog posts from printuz.com WordPress REST API
into blog/meta.json + blog/posts.json for the static news.html SPA.
"""
from __future__ import annotations

import json
import re
import time
from datetime import UTC, datetime
from html import unescape
from pathlib import Path
from urllib.parse import unquote

import requests

BASE = "https://printuz.com/wp-json/wp/v2"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "blog"
POSTS_PER_PAGE = 10


def fetch_json(url: str, retries: int = 6) -> tuple[object, dict]:
    headers_out: dict = {}
    for attempt in range(retries):
        try:
            resp = requests.get(
                url,
                headers={"User-Agent": "PrintuzStaticClone/1.0"},
                timeout=(30, 300),
            )
            resp.raise_for_status()
            headers_out = {k: v for k, v in resp.headers.items()}
            return resp.json(), headers_out
        except (requests.RequestException, json.JSONDecodeError) as exc:
            if attempt == retries - 1:
                raise
            time.sleep(2 * (attempt + 1))
            print(f"  retry {attempt + 1} for {url}: {exc}")
    raise RuntimeError("unreachable")


def strip_html(html: str) -> str:
    text = re.sub(r"<[^>]+>", " ", html or "")
    text = unescape(re.sub(r"\s+", " ", text)).strip()
    return text


def format_wp_date(iso: str) -> str:
    # 2026-09-15T12:00:00 -> September 15, 2026
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.strftime("%B %d, %Y").replace(" 0", " ")
    except ValueError:
        return iso[:10]


def date_parts(iso: str) -> tuple[str, str]:
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return str(dt.day), dt.strftime("%b").upper()
    except ValueError:
        return "?", "???"


def fetch_all(endpoint: str, extra: str = "") -> list:
    items: list = []
    page = 1
    total = None
    while True:
        url = f"{BASE}/{endpoint}?per_page=100&page={page}{extra}"
        batch, headers = fetch_json(url)
        if total is None:
            total = int(headers.get("X-WP-Total") or headers.get("x-wp-total") or 0)
        if not batch:
            break
        items.extend(batch)
        print(f"  {endpoint} page {page}: {len(items)}/{total}")
        if len(items) >= total:
            break
        page += 1
        time.sleep(0.15)
    return items


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    print("Fetching categories…")
    categories_raw = fetch_all("categories")
    categories = [
        {
            "id": c["id"],
            "slug": c["slug"],
            "label": unescape(strip_html(c["name"])),
            "count": c["count"],
        }
        for c in sorted(categories_raw, key=lambda x: x["name"].lower())
    ]
    cat_by_id = {c["id"]: c for c in categories}

    print("Fetching tags…")
    tags_raw = fetch_all("tags")
    tag_by_id = {t["id"]: unescape(strip_html(t["name"])) for t in tags_raw}
    tag_cloud = sorted(
        [
            {"slug": t["slug"], "label": unescape(strip_html(t["name"])), "count": t["count"]}
            for t in tags_raw
            if t.get("count", 0) > 0
        ],
        key=lambda x: (-x["count"], x["label"].lower()),
    )[:20]

    print("Fetching users…")
    users_raw = fetch_all("users")
    authors: dict[str, dict] = {}
    author_by_id: dict[int, str] = {}
    for u in users_raw:
        slug = u.get("slug") or str(u["id"])
        author_by_id[u["id"]] = slug
        authors[slug] = {
            "name": unescape(strip_html(u.get("name") or slug)),
            "bio": unescape(strip_html(u.get("description") or "")),
        }

    print("Fetching posts…")
    posts_raw: list = []
    page = 1
    total = None
    per_page = 15
    while True:
        url = f"{BASE}/posts?per_page={per_page}&page={page}"
        batch, headers = fetch_json(url)
        if total is None:
            total = int(headers.get("X-WP-Total") or headers.get("x-wp-total") or 0)
        if not batch:
            break
        posts_raw.extend(batch)
        print(f"  posts page {page}: {len(posts_raw)}/{total}")
        if len(posts_raw) >= total:
            break
        page += 1
        time.sleep(0.35)

    posts = []
    for p in posts_raw:
        slug = unquote(p["slug"] or "")
        author_id = p.get("author")
        author_slug = author_by_id.get(author_id, str(author_id))

        cat_ids = p.get("categories") or []
        primary_cat = None
        for cid in cat_ids:
            c = cat_by_id.get(cid)
            if c and c["slug"] != "uncategorized":
                primary_cat = c
                break
        if not primary_cat and cat_ids:
            primary_cat = cat_by_id.get(cat_ids[0])

        tag_ids = p.get("tags") or []
        post_tags = [tag_by_id[tid] for tid in tag_ids if tid in tag_by_id]

        excerpt_plain = strip_html(p.get("excerpt", {}).get("rendered", ""))
        posts.append(
            {
                "id": slug,
                "wpId": p["id"],
                "title": unescape(strip_html(p.get("title", {}).get("rendered", ""))),
                "date": format_wp_date(p.get("date", "")),
                "dateIso": p.get("date", ""),
                "dateDay": date_parts(p.get("date", ""))[0],
                "dateMon": date_parts(p.get("date", ""))[1],
                "link": p.get("link", ""),
                "authorSlug": author_slug,
                "categorySlug": primary_cat["slug"] if primary_cat else "uncategorized",
                "categoryLabel": primary_cat["label"] if primary_cat else "Uncategorized",
                "categoryIds": cat_ids,
                "tags": post_tags,
                "commentsOff": p.get("comment_status") != "open",
                "excerpt": excerpt_plain,
                "contentHtml": p.get("content", {}).get("rendered", ""),
            }
        )

    # Recalculate category counts from downloaded posts
    count_by_slug: dict[str, int] = {c["slug"]: 0 for c in categories}
    for p in posts:
        for cid in p["categoryIds"]:
            c = cat_by_id.get(cid)
            if c:
                count_by_slug[c["slug"]] = count_by_slug.get(c["slug"], 0) + 1
    for c in categories:
        c["count"] = count_by_slug.get(c["slug"], c["count"])

    meta = {
        "source": "https://printuz.com/blog/",
        "syncedAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "totalPosts": len(posts),
        "postsPerPage": POSTS_PER_PAGE,
        "totalPages": max(1, (len(posts) + POSTS_PER_PAGE - 1) // POSTS_PER_PAGE),
        "categories": categories,
        "tagCloud": tag_cloud,
        "authors": authors,
    }

    print(f"Writing {len(posts)} posts…")
    (OUT / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "posts.json").write_text(json.dumps(posts, ensure_ascii=False), encoding="utf-8")
    size_mb = (OUT / "posts.json").stat().st_size / (1024 * 1024)
    print(f"Done. blog/posts.json ~ {size_mb:.1f} MB, {len(posts)} posts.")


if __name__ == "__main__":
    main()
