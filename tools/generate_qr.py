#!/usr/bin/env python3
"""Generate the catalog QR code as an SVG from the single config value.

Usage: python3 tools/generate_qr.py
Re-run whenever qrTargetUrl changes in tools/config.json.
Requires: pip install qrcode
"""
import json
import pathlib

import qrcode
import qrcode.image.svg

ROOT = pathlib.Path(__file__).resolve().parent.parent
config = json.loads((ROOT / "tools" / "config.json").read_text())

factory = qrcode.image.svg.SvgPathImage
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=2)
qr.add_data(config["qrTargetUrl"])
qr.make(fit=True)
img = qr.make_image(image_factory=factory)

out = ROOT / config["qrOutput"]
out.parent.mkdir(parents=True, exist_ok=True)
img.save(str(out))

# Force dark modules on a white tile so the code scans on the dark deck surface.
svg = out.read_text()
svg = svg.replace("<svg", '<svg role="img" aria-hidden="true" focusable="false"', 1)
if "fill:#000000" not in svg and 'fill="#000000"' not in svg:
    svg = svg.replace("<path", '<path fill="#001852"', 1)
out.write_text(svg)
print(f"QR for {config['qrTargetUrl']} written to {out}")
