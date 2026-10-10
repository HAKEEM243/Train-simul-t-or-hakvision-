"""Couches vectorielles de la carte (Natural Earth, domaine public) → mapdata.js
Usage : python3 -I tools/build_mapdata.py <dossier_naturalearth> <countries50.geojson> > mapdata.js
Contenu : frontières, fleuves, lacs (détaillés en Afrique), noms des pays, des mers et des grandes régions (déserts, massifs, bassins).
"""
import json, sys, os
NE, C50 = sys.argv[1], sys.argv[2]
AFR = (-20, -36, 55, 38)
def load(n): return json.load(open(os.path.join(NE, n)))
def rnd(c, d):
    if isinstance(c[0], (int, float)): return [round(c[0], d), round(c[1], d)]
    return [rnd(x, d) for x in c]
def simplify(points, tol):
    if len(points) < 4: return points
    import math
    def dseg(p, a, b):
        ax, ay = a; bx, by = b; px, py = p; dx, dy = bx - ax, by - ay
        if dx == 0 and dy == 0: return math.hypot(px - ax, py - ay)
        t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        return math.hypot(px - ax - t * dx, py - ay - t * dy)
    keep = [False] * len(points); keep[0] = keep[-1] = True; st = [(0, len(points) - 1)]
    while st:
        i, j = st.pop(); dm, im = 0, -1
        for k in range(i + 1, j):
            d = dseg(points[k], points[i], points[j])
            if d > dm: dm, im = d, k
        if dm > tol: keep[im] = True; st += [(i, im), (im, j)]
    return [p for p, k in zip(points, keep) if k]
def dedupe(line):
    out = []
    for p in line:
        if not out or p != out[-1]: out.append(p)
    return out
def lines_of(g, d):
    ls = [g['coordinates']] if g['type'] == 'LineString' else g['coordinates']
    return [simplify(dedupe(rnd(l, d)), 0.006 if d >= 3 else 0.02) for l in ls]
def in_afr(g):
    def walk(c):
        if not c: return
        if isinstance(c[0], (int, float)): yield c
        else:
            for x in c: yield from walk(x)
    pts = list(walk(g['coordinates']))
    if not pts: return False
    x = sum(p[0] for p in pts) / len(pts); y = sum(p[1] for p in pts) / len(pts)
    return AFR[0] <= x <= AFR[2] and AFR[1] <= y <= AFR[3]
def fc(feats): return {'type': 'FeatureCollection', 'features': feats}
def F(geom, props=None): return {'type': 'Feature', 'geometry': geom, 'properties': props or {}}

borders = [F({'type': 'MultiLineString', 'coordinates': lines_of(f['geometry'], 2)}) for f in load('ne_50m_admin_0_boundary_lines_land.geojson')['features']]
rivers = []
for f in load('ne_10m_rivers_lake_centerlines.geojson')['features']:
    p = f['properties']; g = f['geometry']
    if not g: continue
    sr = p.get('scalerank', 9)
    if (in_afr(g) and sr <= 8) or sr <= 4:
        rivers.append(F({'type': 'MultiLineString', 'coordinates': lines_of(g, 3 if in_afr(g) else 2)}, {'r': sr, 'n': p.get('name_fr') or p.get('name') or ''}))
lakes = []
for f in load('ne_10m_lakes.geojson')['features']:
    p = f['properties']; g = f['geometry']
    if not g: continue
    if (in_afr(g) and p.get('scalerank', 9) <= 8) or p.get('scalerank', 9) <= 3:
        polys = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
        polys = [[simplify(dedupe(rnd(r, 3)), 0.005) for r in poly] for poly in polys]
        polys = [[r for r in poly if len(r) >= 4] for poly in polys]; polys = [p for p in polys if p]
        lakes.append(F({'type': 'MultiPolygon', 'coordinates': polys}, {'n': p.get('name_fr') or p.get('name') or ''}))
labels = []
for f in json.load(open(C50))['features']:
    p = f['properties']
    labels.append(F({'type': 'Point', 'coordinates': [round(p['LABEL_X'], 3), round(p['LABEL_Y'], 3)]}, {'n': p.get('NAME_FR') or p['NAME'], 'k': 'pays', 'z': p.get('MIN_LABEL', 4)}))
for f in load('ne_50m_geography_marine_polys.geojson')['features']:
    p = f['properties']; sr = p.get('scalerank', 9)
    if sr > 3: continue
    g = f['geometry']; ring = (g['coordinates'][0] if g['type'] == 'Polygon' else max(g['coordinates'], key=lambda q: len(q[0]))[0])
    x = sum(q[0] for q in ring) / len(ring); y = sum(q[1] for q in ring) / len(ring)
    labels.append(F({'type': 'Point', 'coordinates': [round(x, 2), round(y, 2)]}, {'n': p.get('name_fr') or p['name'], 'k': 'mer', 'z': p.get('min_label', sr + 1)}))
for f in load('ne_50m_geography_regions_polys.geojson')['features']:
    p = f['properties']
    if p['FEATURECLA'] not in ('Desert', 'Range/mtn', 'Basin', 'Plateau', 'Plain', 'Valley', 'Delta') or p['SCALERANK'] > (4 if p['REGION'] == 'Africa' else 2): continue
    g = f['geometry']; ring = (g['coordinates'][0] if g['type'] == 'Polygon' else max(g['coordinates'], key=lambda q: len(q[0]))[0])
    x = sum(q[0] for q in ring) / len(ring); y = sum(q[1] for q in ring) / len(ring)
    n = p.get('NAME_FR') or p['NAME']; n = n[0].upper() + n[1:]
    labels.append(F({'type': 'Point', 'coordinates': [round(x, 2), round(y, 2)]}, {'n': n, 'k': 'region', 'z': p.get('MIN_LABEL', 3)}))
out = {'borders': fc(borders), 'rivers': fc(rivers), 'lakes': fc(lakes), 'labels': fc(labels)}
sys.stdout.write('/* Couches de la carte : Natural Earth (domaine public), générées par tools/build_mapdata.py */\n')
sys.stdout.write('const MAPDATA=' + json.dumps(out, separators=(',', ':'), ensure_ascii=False) + ';\n')
