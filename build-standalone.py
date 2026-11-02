#!/usr/bin/env python3
"""Build the single-file deliverable from the multi-file site.

Inlines the stylesheet, the script, the three font files and every photograph as
base64 data URIs, so the page works from a file:// path, an email attachment or
an air-gapped laptop — and previews correctly in a sandboxed viewer.

Usage:  python3 build-standalone.py [output-path]
Default output: ../blackline-standalone.html
"""
import base64
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "blackline-standalone.html"

MIME = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".webp": "image/webp", ".svg": "image/svg+xml",
    ".woff2": "font/woff2", ".woff": "font/woff",
}


def data_uri(path: pathlib.Path) -> str:
    mime = MIME.get(path.suffix.lower(), "application/octet-stream")
    return "data:%s;base64,%s" % (mime, base64.b64encode(path.read_bytes()).decode("ascii"))


html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "assets/css/styles.css").read_text(encoding="utf-8")
js = (ROOT / "assets/js/main.js").read_text(encoding="utf-8")

# 1. Nothing left to preload once everything is inline.
html, n_preload = re.subn(r'[ \t]*<link rel="preload"[^>]*>\n?', "", html)

# 2. Inline the fonts inside the CSS, then the CSS itself.
font_files = sorted((ROOT / "assets/fonts").glob("*.woff2"))
for font in font_files:
    css = css.replace('url("../fonts/%s")' % font.name, 'url("%s")' % data_uri(font))

html = html.replace(
    '<link rel="stylesheet" href="assets/css/styles.css">',
    "<style>\n" + css + "\n</style>",
)

# 3. Inline the script.
html = html.replace(
    '<script src="assets/js/main.js" defer></script>',
    "<script>\n" + js + "\n</script>",
)

# 4. Inline every photograph (src, srcset, og:image).
names = sorted(set(re.findall(r"assets/img/([A-Za-z0-9._-]+)", html)))
missing = 0
for name in names:
    path = ROOT / "assets/img" / name
    if not path.exists():
        print("  ! missing %s" % name, file=sys.stderr)
        missing += 1
        continue
    html = html.replace("assets/img/%s" % name, data_uri(path))

# 5. Report anything still pointing at a file.
leftover = re.findall(r'["(]assets/(?:img|css|js|fonts)/[A-Za-z0-9._-]+', html)
if leftover:
    print("  ! %d unresolved asset reference(s): %s" % (len(leftover), sorted(set(leftover))), file=sys.stderr)

OUT.write_text(html, encoding="utf-8")
print("  %s: %s KB  (%d photos, %d fonts, %d preloads removed)"
      % (OUT.name, format(OUT.stat().st_size / 1024, ",.0f"), len(names) - missing, len(font_files), n_preload))
if leftover or missing:
    sys.exit(1)
