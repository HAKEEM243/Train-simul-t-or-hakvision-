"""Prépare une version « page » (sans <html>/<head>/<body>) pour la publier comme artefact. Usage : python3 -I tools/build_artifact.py <sortie.html>"""
import re, sys
h = open('index.html', encoding='utf-8').read()
h = re.sub(r'<!doctype html>\s*', '', h, flags=re.I)
h = re.sub(r'</?(html|head|body)[^>]*>', '', h)
h = re.sub(r'<meta (charset|name="viewport")[^>]*>\s*', '', h)
h = re.sub(r'<link rel="(manifest|apple-touch-icon)"[^>]*>\s*', '', h)
h = re.sub(r'<script>if\(\'serviceWorker\'.*?</script>\s*', '', h)
open(sys.argv[1], 'w', encoding='utf-8').write(h.strip() + '\n')
