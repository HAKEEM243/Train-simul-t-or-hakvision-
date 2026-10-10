"""Recale chaque tronçon du jeu sur le tracé réel des chemins de fer (Natural Earth 1:10m, domaine public).

Usage : node tools/export_net.js > net.json ; python3 -I tools/build_rails.py net.json ne_10m_railroads.geojson > rails.js
Pour chaque tronçon a→b : plus court chemin dans le graphe des voies réelles entre les points les plus proches des deux gares.
Accepté seulement si la longueur reste plausible ; sinon le tronçon garde une ligne droite. Sortie : const RAILGEO={"a|b":[[lon,lat],…]}.
"""
import json, math, sys, heapq
from collections import defaultdict

net = json.load(open(sys.argv[1])); rr = json.load(open(sys.argv[2]))
R = 6371.0
def hav(a, b):
    la1, la2 = math.radians(a[1]), math.radians(b[1]); dl = math.radians(b[0] - a[0]); dp = la2 - la1
    h = math.sin(dp / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(min(1, h)))

# ---------- graphe des voies réelles ----------
key = lambda p: (round(p[0], 3), round(p[1], 3))          # ~100 m : soude les extrémités voisines
adj = defaultdict(dict); pts = {}
for f in rr['features']:
    g = f['geometry']; lines = [g['coordinates']] if g['type'] == 'LineString' else g['coordinates']
    for line in lines:
        prev = None
        for p in line:
            k = key(p); pts[k] = (p[0], p[1])
            if prev is not None and prev != k:
                d = hav(pts[prev], pts[k]); adj[prev][k] = d; adj[k][prev] = d
            prev = k
# grille pour trouver les nœuds proches d'une gare
grid = defaultdict(list)
for k in adj: grid[(int(math.floor(k[0] * 4)), int(math.floor(k[1] * 4)))].append(k)
def near(p, km):
    out = []; r = int(km / 25) + 1; gx, gy = int(math.floor(p[0] * 4)), int(math.floor(p[1] * 4))
    for i in range(gx - r, gx + r + 1):
        for j in range(gy - r, gy + r + 1):
            for k in grid.get((i, j), ()):
                d = hav(p, pts[k])
                if d <= km: out.append((d, k))
    out.sort(); return out[:12]

def route(a, b, limit):
    A = near(a, 25); B = near(b, 25)
    if not A or not B: return None
    targets = {k: d for d, k in B}; dist = {}; prev = {}; pq = []
    for d, k in A: dist[k] = d; heapq.heappush(pq, (d, k))
    best = None
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist.get(u, 1e18): continue
        if d > limit: break
        if u in targets:
            tot = d + targets[u]
            if best is None or tot < best[0]: best = (tot, u)
        if best and d > best[0]: break
        for v, w in adj[u].items():
            nd = d + w
            if nd < dist.get(v, 1e18): dist[v] = nd; prev[v] = u; heapq.heappush(pq, (nd, v))
    if not best: return None
    path = [best[1]]
    while path[-1] in prev: path.append(prev[path[-1]])
    path.reverse(); return best[0], [pts[k] for k in path]

def simplify(points, tol):
    """Douglas-Peucker (degrés)"""
    if len(points) < 3: return points
    def dseg(p, a, b):
        ax, ay = a; bx, by = b; px, py = p; dx, dy = bx - ax, by - ay
        if dx == 0 and dy == 0: return math.hypot(px - ax, py - ay)
        t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        return math.hypot(px - ax - t * dx, py - ay - t * dy)
    keep = [False] * len(points); keep[0] = keep[-1] = True; stack = [(0, len(points) - 1)]
    while stack:
        i, j = stack.pop(); dm, im = 0, -1
        for k in range(i + 1, j):
            d = dseg(points[k], points[i], points[j])
            if d > dm: dm, im = d, k
        if dm > tol: keep[im] = True; stack += [(i, im), (im, j)]
    return [p for p, k in zip(points, keep) if k]

st = net['stations']; out = {}; kms = {}; ok = 0; tot = 0
for a, b, ferry in net['tracks']:
    if ferry: continue
    tot += 1; A = (st[a][1], st[a][0]); B = (st[b][1], st[b][0]); gc = hav(A, B)
    r = route(A, B, gc * 1.9 + 40)
    if not r or r[0] > gc * 1.8 + 30 or r[0] < gc * 0.85: continue
    line = [A] + r[1] + [B]
    line = simplify(line, 0.004)
    out[a + '|' + b] = [[round(x, 4), round(y, 4)] for x, y in line]; kms[a + '|' + b] = round(r[0]); ok += 1
sys.stderr.write(f'{ok}/{tot} tronçons recalés sur le tracé réel\n')
sys.stdout.write('/* Tracés réels des voies (Natural Earth 1:10m, domaine public), générés par tools/build_rails.py. [lon,lat] */\n')
sys.stdout.write('const RAILGEO=' + json.dumps(out, separators=(',', ':')) + ';\n')
sys.stdout.write('const RAILKM=' + json.dumps(kms, separators=(',', ':')) + ';\n')
