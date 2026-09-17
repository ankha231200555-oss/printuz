"""Fetch newest Printuz blog posts and prepend any missing ones into blog/posts.json."""
from __future__ import annotations

import json
from datetime import UTC, datetime
from html import unescape
from pathlib import Path
from urllib.parse import unquote

import requests

from sync_blog_from_printuz import (
    BASE,
    OUT,
    POSTS_PER_PAGE,
    date_parts,
    fetch_json,
    format_wp_date,
    strip_html,
)

META_PATH = OUT / "meta.json"
POSTS_PATH = OUT / "posts.json"


def map_post(p: dict, cat_by_id: dict, author_by_id: dict, tag_by_id: dict) -> dict:
    slug = unquote(p.get("slug") or "")
    author_id = p.get("author")
    author_slug = author_by_id.get(author_id, str(author_id))
    cat_ids = p.get("categories") or []
    primary_cat = None
    for cid in cat_ids:
        c = cat_by_id.get(cid)
        if c and c.get("slug") != "uncategorized":
            primary_cat = c
            break
    if not primary_cat and cat_ids:
        primary_cat = cat_by_id.get(cat_ids[0])
    tag_ids = p.get("tags") or []
    post_tags = [tag_by_id[tid] for tid in tag_ids if tid in tag_by_id]
    return {
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
        "excerpt": strip_html(p.get("excerpt", {}).get("rendered", "")),
        "contentHtml": p.get("content", {}).get("rendered", ""),
    }


def main() -> None:
    meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    posts = json.loads(POSTS_PATH.read_text(encoding="utf-8"))
    cat_by_id = {c["id"]: c for c in meta.get("categories") or []}
    authors = meta.get("authors") or {}
    author_by_id = {}
    for slug, info in authors.items():
        author_by_id[slug] = slug
    tag_cloud = meta.get("tagCloud") or []
    tag_by_id = {}

    batch, _headers = fetch_json(f"{BASE}/posts?per_page=20&page=1")
    existing = {p.get("wpId") for p in posts}
    new_posts = []
    for raw in batch:
        if raw["id"] in existing:
            continue
        new_posts.append(map_post(raw, cat_by_id, author_by_id, tag_by_id))

    if not new_posts:
        print("No new posts.")
        return

    # Decode existing percent-encoded ids so lookup stays stable
    for p in posts:
        if p.get("id"):
            p["id"] = unquote(p["id"])

    merged = new_posts + posts
    merged.sort(key=lambda x: x.get("dateIso") or "", reverse=True)
    meta["totalPosts"] = len(merged)
    meta["totalPages"] = max(1, (len(merged) + POSTS_PER_PAGE - 1) // POSTS_PER_PAGE)
    meta["syncedAt"] = datetime.now(UTC).isoformat().replace("+00:00", "Z")

    POSTS_PATH.write_text(json.dumps(merged, ensure_ascii=False), encoding="utf-8")
    META_PATH.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Added {len(new_posts)} posts. Total now {len(merged)}.")
    for p in new_posts:
        print(" +", p["date"], p["title"][:80])


if __name__ == "__main__":
    main()
