#!/usr/bin/env python3
"""Regenerate Florece favicon PNGs and favicon.ico from the SVG path (same as florece-logo)."""
from pathlib import Path

from PIL import Image, ImageDraw
from svg.path import parse_path

PATH_D = (
    "M24 6c-2 0-6 2-8 6s-2 8 0 12c2 4 6 6 8 6"
    "M8 26c2 0 6-2 8-6s2-8 0-12c-2-4-6-6-8-6"
)
BG = (255, 253, 248)
STROKE = (143, 61, 61)


def sample_path(path, steps_per_seg=40):
    pts = []
    for seg in path:
        for i in range(steps_per_seg + 1):
            t = i / steps_per_seg
            c = seg.point(t)
            pts.append((c.real, c.imag))
    return pts


def render(pts, minx, miny, w0, h0, size):
    img = Image.new("RGBA", (size, size), BG + (255,))
    draw = ImageDraw.Draw(img)
    scale = size / max(w0, h0)
    ox = (size - w0 * scale) / 2 - minx * scale
    oy = (size - h0 * scale) / 2 - miny * scale
    line = [(ox + x * scale, oy + y * scale) for x, y in pts]
    sw = max(1.5, 2.2 * scale)
    draw.line(line, fill=STROKE + (255,), width=int(round(sw)), joint="curve")
    return img


def main():
    root = Path(__file__).resolve().parents[1]
    path = parse_path(PATH_D)
    pts = sample_path(path)
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    pad = 3.0
    minx, maxx = min(xs) - pad, max(xs) + pad
    miny, maxy = min(ys) - pad, max(ys) + pad
    w0, h0 = maxx - minx, maxy - miny

    out_dir = root / "public" / "images"
    out_dir.mkdir(parents=True, exist_ok=True)
    render(pts, minx, miny, w0, h0, 32).save(out_dir / "favicon-32x32.png", "PNG")
    render(pts, minx, miny, w0, h0, 32).save(out_dir / "favicon.png", "PNG")
    render(pts, minx, miny, w0, h0, 180).save(out_dir / "apple-touch-icon.png", "PNG")

    sizes_ico = [16, 32, 48]
    ico_imgs = [render(pts, minx, miny, w0, h0, s).convert("RGBA") for s in sizes_ico]
    ico_imgs[0].save(
        root / "public" / "favicon.ico",
        format="ICO",
        sizes=[(s, s) for s in sizes_ico],
        append_images=ico_imgs[1:],
    )
    print("Wrote public/images/favicon-32x32.png, favicon.png, apple-touch-icon.png, public/favicon.ico")


if __name__ == "__main__":
    main()
