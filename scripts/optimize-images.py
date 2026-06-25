#!/usr/bin/env python3
"""
Optimize banner.jpg + group-photo.jpeg for the web.

For each source:
  - Generate WebP at multiple widths (responsive srcset)
  - Re-save JPEG at a sane quality if it's bloated

Output naming: {stem}-{width}.{webp|jpg}, plus the original {stem}.jpg kept
untouched as a fallback.

Run:  python3 scripts/optimize-images.py
"""
from __future__ import annotations
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public' / 'imgs'

SOURCES = [
    # (filename, widths to emit for srcset)
    ('banner.jpg', [480, 960, 1440, 1920]),
    ('group-photo.jpeg', [480, 800, 1200]),
]

WEBP_QUALITY = 78  # ~30% smaller than JPEG q85, visually indistinguishable for photo content
JPEG_QUALITY = 82  # down from any default; safe re-encode


def emit_widths(src_path: Path, widths: list[int]) -> None:
    img = Image.open(src_path).convert('RGB')
    src_w, src_h = img.size
    print(f'{src_path.name}: source {src_w}x{src_h}')
    for w in widths:
        if w > src_w:
            continue
        if w == src_w:
            scaled = img
        else:
            ratio = w / src_w
            h = int(src_h * ratio)
            scaled = img.resize((w, h), Image.LANCZOS)
        stem = src_path.stem
        webp_path = PUBLIC / f'{stem}-{w}.webp'
        jpg_path = PUBLIC / f'{stem}-{w}.jpg'
        scaled.save(webp_path, 'WEBP', quality=WEBP_QUALITY, method=6)
        scaled.save(jpg_path, 'JPEG', quality=JPEG_QUALITY, optimize=True, progressive=True)
        print(f'  {w:>4}w → {webp_path.name} ({webp_path.stat().st_size//1024} KB), '
              f'{jpg_path.name} ({jpg_path.stat().st_size//1024} KB)')


def main() -> None:
    for filename, widths in SOURCES:
        src = PUBLIC / filename
        if not src.exists():
            print(f'skip: {src} not found')
            continue
        emit_widths(src, widths)


if __name__ == '__main__':
    main()
