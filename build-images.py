#!/usr/bin/env python3
"""Build the Blackline image set from Pexels originals in /tmp/bl/hi.

Four vehicle photographs from four different shoots are pulled into one look by
a single cinematic grade (near-monochrome, cool shadows, crushed floor). The
fleet grid is deliberately almost monochrome; the hero and closing frame keep a
little colour so the orange accent has something to sit against.

Source photo IDs (Pexels) are recorded in README.md so the client can swap in
their own photography at the same aspect ratios.

Usage: python3 build-images.py <source-dir>
"""
import pathlib
import sys

from PIL import Image, ImageEnhance

SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/bl/hi")
OUT = pathlib.Path(__file__).resolve().parent / "assets/img"
OUT.mkdir(parents=True, exist_ok=True)


def grade(im, sat=0.42, contrast=1.13, bright=0.94):
    im = im.convert("RGB")
    im = ImageEnhance.Color(im).enhance(sat)
    im = ImageEnhance.Contrast(im).enhance(contrast)
    im = ImageEnhance.Brightness(im).enhance(bright)
    r = [(i / 255) ** 1.16 * 255 for i in range(256)]
    g = [(i / 255) ** 1.08 * 255 for i in range(256)]
    b = [(i / 255) ** 0.97 * 255 for i in range(256)]
    return im.point(r + g + b)


def crop_to(im, w, h, fx=0.5, fy=0.5):
    tr = w / h
    sw, sh = im.size
    if sw / sh > tr:
        nw = int(sh * tr)
        x = int((sw - nw) * fx)
        im = im.crop((x, 0, x + nw, sh))
    else:
        nh = int(sw / tr)
        y = int((sh - nh) * fy)
        im = im.crop((0, y, sw, y + nh))
    return im.resize((w, h), Image.LANCZOS)


# file, source, w, h, focus x, focus y, quality, grade kwargs
JOBS = [
    ("hero",              "19019933", 1600, 900, 0.46, 0.50, 62, {"sat": 0.42}),
    ("hero-sm",           "19019933", 900, 900, 0.48, 0.52, 64, {"sat": 0.42, "bright": 0.96}),
    ("fleet-landcruiser", "18029616", 1200, 800, 0.50, 0.52, 64, {"sat": 0.12, "bright": 0.90}),
    ("fleet-prado",       "34166841", 1200, 800, 0.50, 0.50, 64, {"sat": 0.12, "bright": 0.95}),
    ("fleet-corolla",     "37620310", 1200, 800, 0.50, 0.54, 64, {"sat": 0.12, "bright": 0.88}),
    ("fleet-hiace",       "19548262", 1200, 800, 0.58, 0.46, 64, {"sat": 0.00, "contrast": 1.24, "bright": 0.90}),
    ("why-detail",        "34166839", 1000, 1250, 0.50, 0.50, 64, {"sat": 0.10, "bright": 0.92}),
    ("final-night",       "36919630", 1400, 900, 0.50, 0.50, 62, {"sat": 0.26, "bright": 1.04}),
    ("band-fleet",        "18029645", 1600, 560, 0.50, 0.76, 62, {"sat": 0.10, "bright": 0.86}),
]

total = 0
for name, src, w, h, fx, fy, q, gk in JOBS:
    path = SRC / f"{src}.jpg"
    if not path.exists():
        raise SystemExit(f"missing source {path}")
    out = OUT / f"{name}.jpg"
    grade(crop_to(Image.open(path), w, h, fx, fy), **gk).save(
        out, quality=q, optimize=True, progressive=True
    )
    kb = out.stat().st_size / 1024
    total += kb
    print(f"  {name:20s} {w}x{h}  q{q}  {kb:6.1f} KB   <- {src}")
print(f"  {'TOTAL':20s} {total:,.0f} KB")
