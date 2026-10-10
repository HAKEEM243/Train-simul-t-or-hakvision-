"""Fabrique le fond de carte en relief de Hakvision Rail (tuiles raster WebP 256 px, projection Web Mercator).

Sources (libres) :
  - altitudes et profondeurs : tuiles « Terrarium » de Mapzen (AWS Open Data, s3://elevation-tiles-prod) ;
  - terres, déserts, glaciers : Natural Earth (domaine public).
Rendu : teintes hypsométriques (vert des plaines → ocre → roche → neige), forêt tropicale plus sombre près de l'équateur,
déserts sablés, relief ombré multidirectionnel, océans dégradés selon la profondeur, côtes nettes (masque Natural Earth).

Usage : python3 -I tools/build_relief.py <dossier_terrarium> <dossier_naturalearth> <dossier_sortie>
  <dossier_terrarium>/<z>/<x>_<y>.png  (z = 6 partout, 7 et 8 sur les zones détaillées)
Produit <sortie>/tiles/<z>/<x>/<y>.webp puis empaquette dans <sortie>/packs (voir pack_tiles()).
"""
import base64, json, math, os, sys, struct
from multiprocessing import Pool
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

TERR, NE, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = 256

# ---------- projection ----------
def merc(lon, lat):
    lat = max(-85.0511, min(85.0511, lat)); r = math.radians(lat)
    return (lon + 180) / 360, (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2
def tile_lat(y, z):
    n = math.pi - 2 * math.pi * y / 2 ** z
    return math.degrees(math.atan(math.sinh(n)))

# ---------- polygones Natural Earth projetés (coordonnées Mercator 0..1) ----------
def load_polys(path, keep=None):
    out = []
    for f in json.load(open(path))['features']:
        if keep and not keep(f['properties']): continue
        g = f['geometry']; ps = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
        for poly in ps:
            rings = [[merc(p[0], p[1]) for p in ring] for ring in poly]
            xs = [p[0] for p in rings[0]]; ys = [p[1] for p in rings[0]]
            out.append((min(xs), min(ys), max(xs), max(ys), rings))
    return out

LAND = DESERT = GLACIER = None
DESERT_FIELD = None; FIELD_N = 1024
def init():
    global LAND, DESERT, GLACIER, DESERT_FIELD
    LAND = load_polys(os.path.join(NE, 'ne_10m_land.geojson'))
    DESERT = load_polys(os.path.join(NE, 'ne_50m_geography_regions_polys.geojson'), lambda p: p.get('FEATURECLA') == 'Desert')
    GLACIER = load_polys(os.path.join(NE, 'ne_10m_glaciated_areas.geojson'))
    # champ « aridité » mondial basse résolution, très flouté : transitions douces et sans couture entre tuiles
    im = Image.new('L', (FIELD_N, FIELD_N), 0); d = ImageDraw.Draw(im)
    for _, _, _, _, rings in DESERT:
        d.polygon([(px * FIELD_N, py * FIELD_N) for px, py in rings[0]], fill=255)
    DESERT_FIELD = np.asarray(im.filter(ImageFilter.GaussianBlur(5)), np.float32) / 255

def sample_field(F, z, x, y):
    n = 2 ** z; N = F.shape[0]
    u = ((x + (np.arange(T) + 0.5) / T) / n) * N - 0.5; v = ((y + (np.arange(T) + 0.5) / T) / n) * N - 0.5
    u0 = np.clip(np.floor(u).astype(int), 0, N - 2); v0 = np.clip(np.floor(v).astype(int), 0, N - 2)
    fu = np.clip(u - u0, 0, 1)[None, :]; fv = np.clip(v - v0, 0, 1)[:, None]
    a = F[v0[:, None], u0[None, :]]; b = F[v0[:, None], u0[None, :] + 1]; c = F[v0[:, None] + 1, u0[None, :]]; e = F[v0[:, None] + 1, u0[None, :] + 1]
    return a * (1 - fu) * (1 - fv) + b * fu * (1 - fv) + c * (1 - fu) * fv + e * fu * fv

def raster_mask(polys, z, x, y, ss=2):
    """masque 0..1 (anticrénelé) des polygones sur la tuile"""
    n = 2 ** z; x0, y0, x1, y1 = x / n, y / n, (x + 1) / n, (y + 1) / n
    S = T * ss; im = Image.new('L', (S, S), 0); d = ImageDraw.Draw(im); hit = False
    for bx0, by0, bx1, by1, rings in polys:
        if bx1 < x0 or bx0 > x1 or by1 < y0 or by0 > y1: continue
        hit = True
        for k, ring in enumerate(rings):
            pts = [((px - x0) * n * S, (py - y0) * n * S) for px, py in ring]
            if len(pts) > 2: d.polygon(pts, fill=255 if k == 0 else 0)
    if not hit: return np.zeros((T, T), np.float32)
    return np.asarray(im.resize((T, T), Image.LANCZOS), np.float32) / 255

# ---------- altitudes ----------
_cache = {}
def dem(z, x, y):
    k = (z, x % 2 ** z, y)
    if k in _cache: return _cache[k]
    p = os.path.join(TERR, str(z), f'{k[1]}_{y}.png'); a = None
    if os.path.exists(p) and os.path.getsize(p) > 100:
        try:
            im = np.asarray(Image.open(p).convert('RGB'), np.float32)
            a = im[..., 0] * 256 + im[..., 1] + im[..., 2] / 256 - 32768
        except Exception: a = None
    if len(_cache) > 64: _cache.clear()
    _cache[k] = a; return a

def dem_padded(z, x, y):
    c = dem(z, x, y)
    if c is None: return None
    P = np.empty((T + 2, T + 2), np.float32); P[1:-1, 1:-1] = c
    for dx, dy, sl_dst, sl_src in [(-1, 0, (slice(1, -1), 0), (slice(None), -1)), (1, 0, (slice(1, -1), -1), (slice(None), 0)),
                                   (0, -1, (0, slice(1, -1)), (-1, slice(None))), (0, 1, (-1, slice(1, -1)), (0, slice(None)))]:
        nb = dem(z, x + dx, y + dy) if 0 <= y + dy < 2 ** z else None
        P[sl_dst] = nb[sl_src] if nb is not None else c[sl_src]
    P[0, 0], P[0, -1], P[-1, 0], P[-1, -1] = P[1, 1], P[1, -2], P[-2, 1], P[-2, -2]
    return P

# ---------- couleurs ----------
LAND_STOPS = [(-50, (150, 186, 120)), (0, (150, 186, 120)), (150, (163, 195, 127)), (400, (190, 204, 140)), (800, (214, 210, 152)),
              (1300, (212, 190, 140)), (2000, (190, 160, 122)), (2800, (168, 142, 118)), (3800, (196, 186, 178)), (5000, (244, 244, 246))]
SEA_STOPS = [(-11000, (22, 60, 112)), (-6000, (32, 78, 136)), (-4000, (44, 98, 156)), (-2000, (64, 124, 178)), (-500, (98, 158, 204)),
             (-120, (128, 186, 222)), (0, (160, 208, 232))]
def ramp(v, stops):
    xs = np.array([s[0] for s in stops], np.float32); cs = np.array([s[1] for s in stops], np.float32)
    return np.stack([np.interp(v, xs, cs[:, i]) for i in range(3)], -1)

def hillshade(P, z, lat):
    res = 40075016.686 * math.cos(math.radians(lat)) / (T * 2 ** z)
    ex = {6: 7.0, 7: 4.5, 8: 3.0}.get(z, 7)
    E = P * ex
    dzdx = ((E[:-2, 2:] + 2 * E[1:-1, 2:] + E[2:, 2:]) - (E[:-2, :-2] + 2 * E[1:-1, :-2] + E[2:, :-2])) / (8 * res)
    dzdy = ((E[2:, :-2] + 2 * E[2:, 1:-1] + E[2:, 2:]) - (E[:-2, :-2] + 2 * E[:-2, 1:-1] + E[:-2, 2:])) / (8 * res)
    slope = np.arctan(np.hypot(dzdx, dzdy)); aspect = np.arctan2(dzdy, -dzdx)
    out = 0
    for az, w in [(315, 0.6), (270, 0.2), (360, 0.2)]:
        a = math.radians(360 - az + 90); alt = math.radians(42)
        out = out + w * (math.sin(alt) * np.cos(slope) + math.cos(alt) * np.sin(slope) * np.cos(a - aspect))
    return np.clip(out, 0, 1)

def render(z, x, y):
    P = dem_padded(z, x, y)
    if P is None: return None
    h = P[1:-1, 1:-1]; lat = tile_lat(y + 0.5, z)
    lats = np.array([tile_lat(y + (i + 0.5) / T, z) for i in range(T)], np.float32)[:, None] * np.ones((1, T), np.float32)
    land = raster_mask(LAND, z, x, y)
    desert = np.clip(sample_field(DESERT_FIELD, z, x, y) * 1.6, 0, 1); glac = raster_mask(GLACIER, z, x, y)
    if z >= 7:                                    # léger lissage du relief (bruit des données à grande échelle)
        Q = np.pad(P, 1, mode='edge'); P = (Q[:-2, 1:-1] + Q[2:, 1:-1] + Q[1:-1, :-2] + Q[1:-1, 2:] + 4 * Q[1:-1, 1:-1]) / 8
    sh = hillshade(P, z, lat)
    # terres : couleur des plaines selon le climat (forêt équatoriale, savane, forêts tempérées, toundra, désert), puis altitude
    hl = np.maximum(h, 1); al = np.abs(lats)
    trop = np.exp(-(lats / 6.5) ** 2); temp = np.exp(-((al - 50) / 11) ** 2); bore = np.clip((al - 60) / 10, 0, 1)
    sav = np.array([178, 186, 112], np.float32); fore = np.array([52, 108, 56], np.float32); tem = np.array([112, 156, 88], np.float32)
    tun = np.array([158, 160, 128], np.float32); sand = np.array([226, 204, 156], np.float32)
    low = sav * (1 - trop[..., None]) + fore * trop[..., None]
    low = low * (1 - 0.75 * temp[..., None]) + tem * (0.75 * temp[..., None])
    low = low * (1 - bore[..., None]) + tun * bore[..., None]
    low = low * (1 - desert[..., None]) + sand * desert[..., None]
    hi = ramp(hl, LAND_STOPS); wh = np.clip((hl - 350) / 900, 0, 1)[..., None]
    L = low * (1 - wh) + hi * wh
    L = L * (1 - glac[..., None]) + np.array([246, 248, 252], np.float32) * glac[..., None]
    flat = math.sin(math.radians(42))            # éclairage d'un terrain plat : ni assombri ni éclairci
    shade_l = 1 + 1.0 * (sh - flat)
    L = np.clip(L * shade_l[..., None] + 22 * (sh[..., None] - flat), 0, 255)
    # mers
    W = ramp(np.minimum(h, 0), SEA_STOPS)
    W = np.clip(W * (1 + 0.35 * (sh[..., None] - flat)), 0, 255)
    m = land[..., None]
    img = L * m + W * (1 - m)
    # liseré côtier très léger côté mer
    return Image.fromarray(img.astype(np.uint8), 'RGB')

def save(im, z, x, y):
    d = os.path.join(OUT, 'tiles', str(z), str(x)); os.makedirs(d, exist_ok=True)
    im.save(os.path.join(d, f'{y}.webp'), 'WEBP', quality=72, method=4)

def job(args):
    z, x, y = args
    p = os.path.join(OUT, 'tiles', str(z), str(x), f'{y}.webp')
    if os.path.exists(p): return 1
    im = render(z, x, y)
    if im is None: return 0
    save(im, z, x, y); return 1

def downsample(z):
    """tuiles du niveau z à partir des 4 enfants du niveau z+1"""
    n = 2 ** z
    for x in range(n):
        for y in range(n):
            canvas = Image.new('RGB', (2 * T, 2 * T), (32, 78, 136)); ok = False
            for dx in (0, 1):
                for dy in (0, 1):
                    p = os.path.join(OUT, 'tiles', str(z + 1), str(2 * x + dx), f'{2 * y + dy}.webp')
                    if os.path.exists(p): canvas.paste(Image.open(p).convert('RGB'), (dx * T, dy * T)); ok = True
            if ok: save(canvas.resize((T, T), Image.LANCZOS), z, x, y)

# ---------- paquets : un fichier par bloc de 16×16 tuiles (au plus) ----------
def pack_tiles():
    """Format d'un paquet (encodé en base64) : 4 octets (taille de l'index JSON, little-endian) + index {"z/x/y":[début,taille]} + images WebP.
    Niveaux 0-4 : un seul paquet « p0 ». Niveaux 5+ : paquet « p<z>_<x>_<y> » = bloc de 16×16 tuiles (x>>4, y>>4)."""
    root = os.path.join(OUT, 'tiles'); packs = {}
    for z in sorted(os.listdir(root), key=int):
        for x in os.listdir(os.path.join(root, z)):
            for f in os.listdir(os.path.join(root, z, x)):
                y = int(f.split('.')[0]); zi, xi = int(z), int(x)
                key = 'p0' if zi <= 4 else f'p{zi}_{xi >> 4}_{y >> 4}'
                packs.setdefault(key, []).append((f'{zi}/{xi}/{y}', os.path.join(root, z, x, f)))
    od = os.path.join(OUT, 'packs'); os.makedirs(od, exist_ok=True); manifest = {}
    for key, items in packs.items():
        blobs = [open(p, 'rb').read() for _, p in items]; idx = {}; off = 0
        for (k, _), b in zip(items, blobs): idx[k] = [off, len(b)]; off += len(b)
        head = json.dumps(idx, separators=(',', ':')).encode()
        raw = struct.pack('<I', len(head)) + head + b''.join(blobs)
        # stocké en base64 (fichier texte) : les pages claude.ai ne servent pas les fichiers binaires bruts
        with open(os.path.join(od, key + '.txt'), 'w') as f: f.write(base64.b64encode(raw).decode())
        manifest[key] = len(items)
    json.dump(manifest, open(os.path.join(od, 'manifest.json'), 'w'))
    return manifest

if __name__ == '__main__':
    jobs = []
    for z in sorted(os.listdir(TERR), key=int):
        for f in os.listdir(os.path.join(TERR, z)):
            x, y = f[:-4].split('_'); jobs.append((int(z), int(x), int(y)))
    jobs.sort(key=lambda j: (j[0], j[1] // 8, j[2] // 8, j[1], j[2]))
    with Pool(os.cpu_count(), initializer=init) as pool:
        done = sum(pool.imap_unordered(job, jobs, chunksize=16))
    print('tuiles rendues', done)
    for z in range(5, -1, -1): downsample(z)
    m = pack_tiles(); print('paquets', len(m), 'tuiles', sum(m.values()))
