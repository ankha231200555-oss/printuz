import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
raw = (root / "_extension_content.html").read_text(encoding="utf-8")

# WP upload filename -> local asset
IMG_MAP = {
    "image-2.png": "02-extract-zip-winrar.png",
    "image-3.png": "03-chrome-extensions-menu.png",
    "image-4.png": "04-chrome-developer-load-unpacked.png",
    "image-5.png": "05-select-extension-folder.png",
    "image-6.png": "06-copy-api-token-profile.png",
    "image-7-957x800.png": "07-paste-token-add-token.png",
    "image-7.png": "07-paste-token-add-token.png",
    "image-8-970x800.png": "07-paste-token-add-token.png",
    "image-8.png": "07-paste-token-add-token.png",
    "image-11.png": "08-add-product-on-listing.png",
    "image-15-1195x800.png": "10-printuz-sync-etsy-guide.png",
    "image-15.png": "10-printuz-sync-etsy-guide.png",
    "image-13.png": "11-sync-orders-etsy-extension.png",
    "image-16.png": "12-sync-ebay-order-workflow.png",
}

def repl_src(m):
    url = m.group(1)
    for key, local in IMG_MAP.items():
        if key in url:
            return 'src="' + local + '"'
    return m.group(0)

html = re.sub(r'src="(https://printuz.com/wp-content/uploads/2024/11/[^"]+)"', repl_src, raw)
html = re.sub(
    r'src="(\d{2}-[^"]+\.png)"',
    lambda m: 'src="assets/extension/' + m.group(1) + '"',
    html,
)
html = re.sub(r'\sstyle="[^"]*"', "", html)
html = re.sub(r'\s(srcset|sizes)="[^"]*"', "", html)
html = re.sub(r'\sclass="wp-image-\d+"', "", html)
html = re.sub(r'\sloading="[^"]*"', ' loading="lazy"', html)
html = re.sub(r'\swidth="\d+"\sheight="\d+"', "", html)

# Insert manager screenshot after image-11 figure (original site flow in user screenshots)
insert = (
    '\n<figure class="wp-block-image size-full ext-figure">'
    '<img loading="lazy" decoding="async" src="assets/extension/09-manager-my-product-change-product.png" alt="" />'
    "</figure>\n"
)
html = re.sub(
    r'(<figure[^>]*>\s*<img[^>]*src="assets/extension/08-add-product-on-listing\.png"[^>]*/>\s*</figure>)',
    r"\1" + insert,
    html,
    count=1,
)

# Normalize classes for our CSS
html = html.replace('class="wp-block-heading"', 'class="wp-block-heading ext-wp-h2"')
html = html.replace('class="wp-block-list"', 'class="wp-block-list ext-wp-list"')
html = html.replace('class="wp-block-paragraph"', 'class="wp-block-paragraph"')
html = html.replace(
    'class="wp-block-image size-full is-resized"',
    'class="wp-block-image size-full ext-figure ext-figure--resized"',
)
html = html.replace('class="wp-block-image size-full"', 'class="wp-block-image size-full ext-figure"')
html = html.replace('class="wp-block-image size-large"', 'class="wp-block-image size-large ext-figure"')

out = root / "assets" / "extension-body.html"
out.write_text(html.strip(), encoding="utf-8")
print("wrote", out, "len", len(html))
