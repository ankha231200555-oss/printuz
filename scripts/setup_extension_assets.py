import shutil
from pathlib import Path

SRC = Path(r"C:\Users\HP\.cursor\projects\e-hoc-tap-hoc-printuz\assets")
DST = Path(__file__).resolve().parents[1] / "assets" / "extension"

# uuid fragment -> filename (tutorial + WP image-N mapping)
FILES = [
    ("337559b4-7042-456c-85ea-7e3b3e093c31", "00-featured-hero.png"),
    ("926b4473-c595-4f6d-83d3-b604fe15e70b", "01-extension-popup-overview.png"),
    ("9e9b150b-47fa-4f61-bf7d-56482f270bda", "02-extract-zip-winrar.png"),
    ("0e89d0e5-cd22-491c-aa64-83da15d80b7a", "03-chrome-extensions-menu.png"),
    ("044a0760-5b1c-404f-b217-c87a1c39b681", "04-chrome-developer-load-unpacked.png"),
    ("3c59dce2-93ad-436a-a83f-294d297e6e19", "05-select-extension-folder.png"),
    ("a47eab86-7417-4245-ad00-da0c30dc6d01", "06-copy-api-token-profile.png"),
    ("c19e6cd5-2e43-45df-9dca-1ae7edc034c1", "07-paste-token-add-token.png"),
    ("fc21d96f-e6cc-4f36-b801-89a69da78f21", "08-add-product-on-listing.png"),
    ("e29b3739-663a-463c-84a6-f3d2adca15d9", "09-manager-my-product-change-product.png"),
    ("4c524715-87b7-48a6-b025-0e0db9d16b1c", "10-printuz-sync-etsy-guide.png"),
    ("d856c499-a2c1-4a0e-af7e-935d8977c6e1", "11-sync-orders-etsy-extension.png"),
    ("f745a821-df90-4ac9-8834-51ac12b9ef7c", "12-sync-ebay-order-workflow.png"),
]

DST.mkdir(parents=True, exist_ok=True)
for frag, name in FILES:
    matches = list(SRC.glob(f"*images_image-{frag}*.png"))
    if not matches:
        print("MISSING", frag, name)
        continue
    shutil.copy2(matches[0], DST / name)
    print("OK", name)
