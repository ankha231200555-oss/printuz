import re
from pathlib import Path
from shutil import copy2

root = Path(__file__).resolve().parents[1]
src = Path(
    r"C:\Users\HP\.cursor\projects\e-hoc-tap-hoc-printuz\assets\c__Users_HP_AppData_Roaming_Cursor_User_workspaceStorage_098cbd0250765ee4f6c573e2eeebc77e_images_image-1e8fa257-dfcd-4cf5-977a-9592bf6182c3.png"
)
dst = root / "assets" / "logo-mark.png"
dst.parent.mkdir(parents=True, exist_ok=True)
copy2(src, dst)
print("copied", dst, dst.stat().st_size, "bytes")

html = (root / "index.html").read_text(encoding="utf-8")
new_img = '<img src="assets/logo-mark.png" alt="" class="about-logo mb-3" width="56" height="56">'
pattern = (
    r'<section class="py-4" id="about">\s*'
    r'<img src="data:image/png;base64,[^"]+" alt="[^"]*" class="about-logo mb-3">'
)
html2, n = re.subn(
    pattern,
    '<section class="py-4" id="about">\n    ' + new_img,
    html,
    count=1,
)
if n != 1:
    raise SystemExit(f"replace failed, count={n}")
(root / "index.html").write_text(html2, encoding="utf-8")
print("updated index.html about logo")
