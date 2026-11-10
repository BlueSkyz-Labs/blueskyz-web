#!/usr/bin/env python3
"""Reproducibly derive the site's display face from the Brand Kit v5 type masters.

Source: brand/blueskyz-brand-kit-v5/03_Type/noto-serif-display-{latin,vietnamese}-wght-{normal,italic}.woff2
(Noto Serif Display variable, wght 100-900, SIL OFL 1.1; licence beside the masters).
Transform: pin wght to 300 (the kit's display weight; the site sets display
headings in one weight only), keep cmap and all layout features, drop
hinting/gasp/STAT/MVAR. OFL 1.1 permits modification; "Noto" is not a Reserved
Font Name.

  pip install --user fonttools brotli
  python3 tools/instance-noto-serif-display.py <master.woff2> public/fonts/noto-serif-display-<subset>-300[-italic]-v2.003.woff2
"""
import io
import sys
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

src, dst = sys.argv[1:3]
font = instancer.instantiateVariableFont(TTFont(src), {"wght": 300})
opts = subset.Options()
opts.flavor = "woff2"
opts.layout_features = ["*"]
opts.hinting = False
opts.notdef_outline = True
opts.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
opts.drop_tables += ["gasp", "STAT", "MVAR"]
buf = io.BytesIO()
font.save(buf)  # round-trip so glyph tables are fully loaded before subsetting
buf.seek(0)
font = TTFont(buf)
sub = subset.Subsetter(opts)
sub.populate(unicodes=list(font.getBestCmap().keys()))
sub.subset(font)
font.flavor = "woff2"
font.save(dst)
