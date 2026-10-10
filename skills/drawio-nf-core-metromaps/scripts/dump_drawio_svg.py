#!/usr/bin/env python3
"""Print the draw.io diagram embedded in an exported SVG (or PNG) as one line per cell.

A draw.io export made with "include a copy of my diagram" carries the whole diagram: in the SVG
`content` attribute, in the PNG `mxfile` tEXt chunk. Reading it locally is far cheaper than
pulling cells out of the browser, whose javascript_tool output is truncated at ~1.5k chars.

Usage: dump_drawio_svg.py <export.svg|.png> [--xml out.xml]
Columns: id | V(ertex)/E(dge) | parent | label | style id | x,y,w,h [pts] [source>target]
Styles are listed once at the end (embedded image data shortened to DATA).
"""
import argparse
import base64
import html
import re
import struct
import urllib.parse
import xml.etree.ElementTree as ET
import zlib


def mxfile_from_png(path):
    data = open(path, "rb").read()
    pos = 8
    while pos < len(data):
        length, kind = struct.unpack(">I4s", data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + length]
        if kind == b"tEXt" and body.startswith(b"mxfile\0"):
            return urllib.parse.unquote(body[7:].decode("latin-1"))
        pos += 12 + length
    raise SystemExit("no mxfile chunk: export the PNG as editable")


def mxfile_from_svg(path):
    match = re.search(r'content="([^"]*)"', open(path, encoding="utf-8").read())
    if not match:
        raise SystemExit("no content attribute: export the SVG as editable")
    return html.unescape(match.group(1))


def graph_models(mxfile):
    for diagram in ET.fromstring(mxfile).iter("diagram"):
        model = diagram.find("mxGraphModel")
        if model is None:  # compressed: base64(deflate(urlencode(xml)))
            raw = zlib.decompress(base64.b64decode(diagram.text.strip()), -15)
            model = ET.fromstring(urllib.parse.unquote(raw.decode()))
        yield diagram.get("name"), model


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("export")
    parser.add_argument("--xml", help="also write the decoded diagram XML here")
    args = parser.parse_args()

    mxfile = mxfile_from_png(args.export) if args.export.endswith(".png") else mxfile_from_svg(args.export)
    styles = {}
    for name, model in graph_models(mxfile):
        print(f"## page {name}")
        if args.xml:
            ET.ElementTree(model).write(args.xml, encoding="unicode")
        for cell in model.iter("mxCell"):
            if cell.get("id") in ("0", "1"):
                continue
            style = re.sub(r"image=data:[^;]*", "image=DATA", cell.get("style") or "")
            sid = styles.setdefault(style, f"s{len(styles)}")
            label = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(cell.get("value") or ""))).strip()[:40]
            geo, ends = "", ""
            g = cell.find("mxGeometry")
            if g is not None:
                geo = ",".join(str(round(float(g.get(k, 0)))) for k in ("x", "y", "width", "height"))
                pts = g.find("Array")
                if pts is not None:
                    geo += " pts:" + ";".join(f"{round(float(p.get('x', 0)))},{round(float(p.get('y', 0)))}" for p in pts)
            if cell.get("edge"):
                ends = f" {cell.get('source', '-')}>{cell.get('target', '-')}"
            parent = "" if cell.get("parent") == "1" else cell.get("parent")
            print(f"{cell.get('id')}|{'E' if cell.get('edge') else 'V'}|{parent}|{label}|{sid}|{geo}{ends}")
    print("## styles")
    for style, sid in styles.items():
        print(f"{sid}: {style[:300]}")


if __name__ == "__main__":
    main()
