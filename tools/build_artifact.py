"""Construit une page autonome (tout en un seul fichier : Leaflet, carte, scripts) pour la publier sur claude.ai.
Usage : python3 -I tools/build_artifact.py <sortie.html>"""
import re, sys
h = open('index.html', encoding='utf-8').read()
h = re.sub(r'<!doctype html>\s*', '', h, flags=re.I)
h = re.sub(r'</?(html|head|body)\b[^>]*>', '', h)
h = re.sub(r'<meta (charset|name="viewport")[^>]*>\s*', '', h)
h = re.sub(r'<link rel="(manifest|apple-touch-icon)"[^>]*>\s*', '', h)
h = re.sub(r'<script>if\(\'serviceWorker\'.*?</script>\s*', '', h)
def safe(js): return js.replace('</script', '<\\/script')
import base64
css = open('vendor/leaflet.css', encoding='utf-8').read()
css = re.sub(r'url\(images/([\w-]+\.png)\)', lambda m: 'url(data:image/png;base64,' + base64.b64encode(open('vendor/images/' + m.group(1), 'rb').read()).decode() + ')', css)
h = h.replace('<link rel="stylesheet" href="vendor/leaflet.css">', '<style>' + css + '</style>')
def inline(m):
    return '<script>' + safe(open(m.group(1), encoding='utf-8').read()) + '</script>'
h = re.sub(r'<script src="([\w/.-]+\.js)(?:\?v=[\d.]+)?"></script>', inline, h)
open(sys.argv[1], 'w', encoding='utf-8').write(h.strip() + '\n')
