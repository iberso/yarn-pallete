"""Buat thumbnail WebP 4:3 untuk grid dari foto asli images/<n>.jpg.

Foto asli 1024x1024 dengan label nomor di bagian bawah; thumbnail dipotong
ke area benang (tanpa label) supaya kartu terlihat bersih.

Pakai:  python tools/make-thumbs.py          (butuh: pip install pillow)
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "images")
DST = os.path.join(SRC, "thumbs")
SIZE = (480, 360)          # 4:3
TOP, BOTTOM = 0.075, 0.825  # potongan vertikal (proporsi tinggi foto)

os.makedirs(DST, exist_ok=True)
for name in sorted(os.listdir(SRC)):
    if not name.endswith(".jpg"):
        continue
    im = Image.open(os.path.join(SRC, name)).convert("RGB")
    w, h = im.size
    im = im.crop((0, round(h * TOP), w, round(h * BOTTOM))).resize(SIZE, Image.LANCZOS)
    im.save(os.path.join(DST, name[:-4] + ".webp"), "WEBP", quality=80, method=6)
    print("ok", name)
