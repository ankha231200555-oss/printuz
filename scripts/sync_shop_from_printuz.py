"""
Download WooCommerce catalog from printuz.com Store API
into shop/meta.json + shop/products.json for shop.html.
"""
from __future__ import annotations

import json
import re
import time
from datetime import UTC, datetime
from html import unescape
from pathlib import Path

import requests

BASE = "https://printuz.com/wp-json/wc/store/v1"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "shop"
PER_PAGE = 28


def strip_html(html: str) -> str:
    text = re.sub(r"<[^>]+>", " ", html or "")
    return unescape(re.sub(r"\s+", " ", text)).strip()


SPEC_KEYS = ("Material", "Product code", "Weight", "Production time")


def specs_from_short(html: str) -> list[dict]:
    text = strip_html(html or "")
    if not text:
        return []
    specs: list[dict] = []
    for key in SPEC_KEYS:
        m = re.search(rf"{re.escape(key)}\s*:", text, re.I)
        if not m:
            continue
        rest = text[m.end() :]
        end = len(rest)
        for other in SPEC_KEYS:
            if other.lower() == key.lower():
                continue
            nx = re.search(rf"\s{re.escape(other)}\s*:", rest, re.I)
            if nx and nx.start() < end:
                end = nx.start()
        value = rest[:end].strip()
        if value:
            specs.append({"label": f"{key}:", "value": value})
    return specs


def specs_from_html_table(html: str) -> list[dict]:
    if not html or "<table" not in html.lower():
        return []
    specs: list[dict] = []
    for tr in re.finditer(r"<tr[\s\S]*?</tr>", html, re.I):
        cells = re.findall(r"<t[dh][^>]*>([\s\S]*?)</t[dh]>", tr.group(0), re.I)
        if len(cells) < 2:
            continue
        label = strip_html(cells[0])
        value = strip_html(cells[1])
        if not label or not value:
            continue
        for key in SPEC_KEYS:
            if key.lower() in label.lower():
                specs.append({"label": f"{key}:", "value": value})
                break
    return specs


def _spec_map(specs: list[dict]) -> dict[str, str]:
    out: dict[str, str] = {}
    for row in specs:
        key = row["label"].lower().split(":")[0].strip()
        out[key] = row["value"]
    return out


def infer_material(plain: str) -> str:
    m = re.search(r"Material:\s*([^\.]+)", plain, re.I)
    if m:
        return m.group(1).strip()
    m = re.search(
        r"Made from (?:high-quality )?([^,\.]+?)(?: combined| with|,|\.)",
        plain,
        re.I,
    )
    if m:
        return m.group(1).strip().title()
    for word in (
        "Polyester",
        "Acrylic",
        "Cotton",
        "Leather",
        "Silicone",
        "Wood",
        "Metal",
        "Canvas",
        "Nylon",
    ):
        if re.search(rf"\b{word}\b", plain, re.I):
            return word
    return "—"


def model_from_html(html: str) -> str | None:
    m = re.search(r"Model[\s\S]{0,900}?<td[^>]*>([A-Za-z0-9]+)</td>", html, re.I)
    return m.group(1) if m else None


def infer_weight(plain: str) -> str:
    m = re.search(r"Weight:\s*(\S+)", plain, re.I)
    if m:
        return m.group(1)
    m = re.search(r"\b(\d+(?:\.\d+)?\s*g)\b", plain, re.I)
    if m:
        return m.group(1).replace(" ", "")
    return "—"


def infer_production(plain: str) -> str:
    m = re.search(r"Production time:\s*([^\.]+)", plain, re.I)
    if m:
        val = m.group(1).strip()
        if len(val) <= 24:
            return val
    m = re.search(r"\b(\d+\s*~\s*\d+\s*Days?)\b", plain, re.I)
    if m:
        return re.sub(r"\s+", "", m.group(1))
    return "5~7 Days"


def normalize_production(value: str) -> str:
    if not value or len(value) > 24 or "typically" in value.lower():
        return "5~7 Days"
    return value


def product_code_fallback(slug: str, wp_id: int | None, html: str, plain: str) -> str:
    m = re.search(r"Product code:\s*(\S+)", plain, re.I)
    if m:
        return m.group(1)
    model = model_from_html(html)
    if model:
        return model
    if wp_id:
        return f"P{wp_id}"
    token = re.sub(r"[^a-z0-9]", "", (slug or "").lower())[:10].upper()
    return token or "—"


def build_product_specs(p_raw: dict) -> list[dict]:
    short = p_raw.get("short_description") or ""
    desc = p_raw.get("description") or ""
    partial = specs_from_short(short)
    if len(partial) < 4:
        for block in (specs_from_short(desc), specs_from_html_table(short), specs_from_html_table(desc)):
            for row in block:
                key = row["label"].lower().split(":")[0].strip()
                if key not in _spec_map(partial):
                    partial.append(row)
            if len(partial) >= 4:
                break
    if len(partial) >= 4:
        return partial[:4]
    mapped = _spec_map(partial)
    plain = strip_html(desc)[:3500] or strip_html(short)
    html = desc or short
    slug = p_raw.get("slug") or ""
    wp_id = p_raw.get("id")
    return [
        {"label": "Material:", "value": mapped.get("material") or infer_material(plain)},
        {
            "label": "Product code:",
            "value": mapped.get("product code")
            or product_code_fallback(slug, wp_id, html, plain),
        },
        {"label": "Weight:", "value": mapped.get("weight") or infer_weight(plain)},
        {
            "label": "Production time:",
            "value": normalize_production(
                mapped.get("production time") or infer_production(plain)
            ),
        },
    ]


def fetch_json(url: str, retries: int = 6) -> tuple[object, dict]:
    for attempt in range(retries):
        try:
            resp = requests.get(
                url,
                headers={"User-Agent": "PrintuzStaticClone/1.0"},
                timeout=(20, 180),
            )
            resp.raise_for_status()
            return resp.json(), dict(resp.headers)
        except (requests.RequestException, json.JSONDecodeError) as exc:
            if attempt == retries - 1:
                raise
            time.sleep(2 * (attempt + 1))
            print(f"  retry {attempt + 1}: {exc}")
    raise RuntimeError("unreachable")


def fetch_all_categories() -> list:
    items: list = []
    page = 1
    total = None
    while True:
        url = f"{BASE}/products/categories?per_page=100&page={page}"
        batch, headers = fetch_json(url)
        if total is None:
            total = int(headers.get("X-WP-Total") or headers.get("x-wp-total") or 0)
        if not batch:
            break
        items.extend(batch)
        if len(items) >= total:
            break
        page += 1
        time.sleep(0.2)
    return items


def price_cents(prices: dict) -> tuple[int | None, int | None]:
    if not prices:
        return None, None
    rng = prices.get("price_range")
    if rng and rng.get("min_amount") is not None:
        return int(rng["min_amount"]), int(rng.get("max_amount") or rng["min_amount"])
    p = prices.get("price") or prices.get("regular_price")
    if p is None or p == "":
        return None, None
    val = int(p)
    return val, val


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    print("Fetching categories...")
    cats_raw = fetch_all_categories()
    categories = [
        {
            "id": c["id"],
            "slug": c["slug"],
            "label": unescape(strip_html(c["name"])),
            "parent": c.get("parent") or 0,
            "count": c.get("count") or 0,
        }
        for c in sorted(cats_raw, key=lambda x: x["name"].lower())
    ]

    print("Fetching products...")
    products_raw: list = []
    page = 1
    total = None
    while True:
        url = f"{BASE}/products?per_page={PER_PAGE}&page={page}"
        batch, headers = fetch_json(url)
        if total is None:
            total = int(headers.get("X-WP-Total") or headers.get("x-wp-total") or 0)
        if not batch:
            break
        products_raw.extend(batch)
        print(f"  page {page}: {len(products_raw)}/{total}")
        if len(products_raw) >= total:
            break
        page += 1
        time.sleep(0.35)

    products = []
    for p in products_raw:
        prices = p.get("prices") or {}
        min_c, max_c = price_cents(prices)
        cats = p.get("categories") or []
        images = p.get("images") or []
        img = images[0]["src"] if images else ""
        thumb = images[0].get("thumbnail") if images else None
        products.append(
            {
                "id": p["slug"],
                "wpId": p["id"],
                "name": unescape(strip_html(p.get("name", ""))),
                "permalink": p.get("permalink", ""),
                "priceHtml": strip_html(p.get("price_html") or ""),
                "priceMin": min_c,
                "priceMax": max_c,
                "onSale": bool(p.get("on_sale")),
                "inStock": bool(p.get("is_in_stock", True)),
                "categoryIds": [c["id"] for c in cats],
                "categoryLabels": [unescape(strip_html(c.get("name", ""))) for c in cats],
                "image": thumb or img,
                "images": [i.get("src") or "" for i in images if i.get("src")],
                "descriptionHtml": p.get("description") or "",
                "shortDescription": strip_html(p.get("short_description") or "")[:500],
                "shortDescriptionHtml": p.get("short_description") or "",
                "specs": build_product_specs(p),
            }
        )

    total_pages = max(1, (len(products) + PER_PAGE - 1) // PER_PAGE)
    meta = {
        "source": "https://printuz.com/shop/",
        "syncedAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "totalProducts": len(products),
        "productsPerPage": PER_PAGE,
        "totalPages": total_pages,
        "categories": categories,
    }

    print(f"Writing {len(products)} products...")
    (OUT / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "products.json").write_text(json.dumps(products, ensure_ascii=False), encoding="utf-8")
    mb = (OUT / "products.json").stat().st_size / (1024 * 1024)
    print(f"Done. shop/products.json ~ {mb:.1f} MB")


if __name__ == "__main__":
    main()
