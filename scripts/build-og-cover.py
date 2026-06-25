#!/usr/bin/env python3
"""
Build the Open Graph share image (1200x630) for InnOSeed Lab.

Output: public/imgs/og-cover.png

What it does:
1. Loads banner.jpg as background, blurs + dims it
2. Overlays the InnOSeed brand wordmark and tagline (PingFang for Chinese)
3. Saves as PNG with alpha-safe compositing

Run:  python3 scripts/build-og-cover.py
"""
from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'public' / 'imgs' / 'banner.jpg'
OUT = ROOT / 'public' / 'imgs' / 'og-cover.png'

CANVAS_W, CANVAS_H = 1200, 630

# macOS system font — PingFang.ttc supports Simplified Chinese + Latin
FONT_PATH = '/System/Library/Fonts/PingFang.ttc'
# TTC font index: 0 = PingFangTC-Regular. We use 4 (PingFangTC-Semibold)
# for a heavier display weight; fall back to 0 if not available.
FONT_INDEX_DISPLAY = 4
FONT_INDEX_BODY = 0

INK_PRIMARY = (245, 239, 230)   # #F5EFE6 — warm cream
INK_MUTED = (200, 195, 185)
ACCENT_BLUE = (28, 100, 242)    # #1C64F2 — InnOSeed brand


def open_font(idx: int, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_PATH, size, index=idx)


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f'Missing source: {SRC}')

    bg = Image.open(SRC).convert('RGB')
    # Cover-fit the banner into the canvas.
    bw, bh = bg.size
    target_ratio = CANVAS_W / CANVAS_H
    src_ratio = bw / bh
    if src_ratio > target_ratio:
        # Source is wider — crop horizontally
        new_w = int(bh * target_ratio)
        left = (bw - new_w) // 2
        bg = bg.crop((left, 0, left + new_w, bh))
    else:
        new_h = int(bw / target_ratio)
        top = (bh - new_h) // 2
        bg = bg.crop((0, top, bw, top + new_h))
    bg = bg.resize((CANVAS_W, CANVAS_H), Image.LANCZOS)

    # Light dim overlay so the cream text reads well over the watercolor
    # without erasing the banner entirely.
    dim = Image.new('RGB', (CANVAS_W, CANVAS_H), (15, 14, 12))  # #0F0E0C
    bg = Image.blend(bg, dim, 0.28)

    # Subtle vignette so the corners fall off slightly
    from PIL import ImageFilter
    vignette = Image.new('L', (CANVAS_W, CANVAS_H), 0)
    vd = ImageDraw.Draw(vignette)
    vd.ellipse((-200, -200, CANVAS_W + 200, CANVAS_H + 200), fill=255)
    vignette = vignette.filter(ImageFilter.GaussianBlur(180))
    bg = Image.composite(
        bg,
        Image.new('RGB', (CANVAS_W, CANVAS_H), (0, 0, 0)),
        Image.eval(vignette, lambda x: int((255 - x) * 0.25)),
    )

    draw = ImageDraw.Draw(bg)

    # Eyebrow
    eyebrow_font = open_font(FONT_INDEX_BODY, 26)
    draw.text(
        (96, 110),
        'CSU INNOSEED LAB  ·  EST. 2019',
        font=eyebrow_font,
        fill=INK_MUTED,
    )

    # Main display wordmark
    display_font = open_font(FONT_INDEX_DISPLAY, 148)
    draw.text((96, 168), 'InnOSeed', font=display_font, fill=INK_PRIMARY)

    # Italic accent line — "Different Thinkers" in brand blue, on a single
    # baseline; "的俱乐部。" follows below in primary cream.
    accent_font = open_font(FONT_INDEX_DISPLAY, 72)
    draw.text(
        (100, 340),
        'Different Thinkers',
        font=accent_font,
        fill=ACCENT_BLUE,
    )
    body_accent = open_font(FONT_INDEX_BODY, 56)
    draw.text(
        (100, 425),
        '的俱乐部。',
        font=body_accent,
        fill=INK_PRIMARY,
    )

    # Footer line
    footer_font = open_font(FONT_INDEX_BODY, 24)
    draw.text(
        (96, CANVAS_H - 90),
        '中南大学计算机学院  ·  竞赛 · 科研 · 创业 · 志合者',
        font=footer_font,
        fill=INK_MUTED,
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    bg.save(OUT, 'PNG', optimize=True)
    print(f'wrote {OUT}  ({OUT.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
