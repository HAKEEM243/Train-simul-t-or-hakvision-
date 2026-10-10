"""Construit world.js (fond de carte vectoriel compact) depuis Natural Earth (domaine public).
Usage : python3 -I tools/build_world.py <dossier_geojson> > world.js"""
import json, sys, os
D = sys.argv[1]
AFR = (-20, -36, 55, 38)  # lon min, lat min, lon max, lat max : Afrique en détail (1:50m)
def inbox(geom, box):
    xs = []
    def walk(c):
        if isinstance(c[0], (int, float)): xs.append(c)
        else:
            for x in c: walk(x)
    walk(geom['coordinates'])
    lon = sum(p[0] for p in xs)/len(xs); lat = sum(p[1] for p in xs)/len(xs)
    return box[0] <= lon <= box[2] and box[1] <= lat <= box[3]
def simp(ring, dec):
    out = []
    for p in ring:
        q = [round(p[0], dec), round(p[1], dec)]
        if not out or q != out[-1]: out.append(q)
    return out
def polys(geom, dec, minpts=4):
    ps = [geom['coordinates']] if geom['type'] == 'Polygon' else geom['coordinates']
    res = []
    for poly in ps:
        rings = [simp(r, dec) for r in poly]
        rings = [r for r in rings if len(r) >= minpts]
        if rings: res.append(rings)
    return res
c50 = json.load(open(os.path.join(D, 'countries50.geojson')))
c110 = json.load(open(os.path.join(D, 'countries110.geojson')))
countries = []
afr = set()
for f in c50['features']:
    if inbox(f['geometry'], AFR):
        afr.add(f['properties']['ADM0_A3'])
        countries.append([f['properties']['ADM0_A3'], f['properties'].get('NAME_FR') or f['properties']['NAME'], polys(f['geometry'], 2)])
for f in c110['features']:
    if f['properties']['ADM0_A3'] not in afr:
        countries.append([f['properties']['ADM0_A3'], f['properties'].get('NAME_FR') or f['properties']['NAME'], polys(f['geometry'], 1)])
lakes = []
for f in json.load(open(os.path.join(D, 'lakes50.geojson')))['features']:
    if inbox(f['geometry'], AFR) and f['properties'].get('scalerank', 9) <= 2:
        lakes.append(polys(f['geometry'], 2))
RIV = {'Congo','Lualaba','Kasai','Ubangi','Kwango','Sangha','Uele','Tshuapa','Ruki','Busira','Zambezi','Nile','Niger','Orange','Limpopo','Kafue','Semliki'}
rivers = []
for f in json.load(open(os.path.join(D, 'rivers50.geojson')))['features']:
    if f['properties'].get('name') in RIV and inbox(f['geometry'], AFR):
        g = f['geometry']; ls = [g['coordinates']] if g['type'] == 'LineString' else g['coordinates']
        for l in ls: rivers.append([f['properties']['name'], simp(l, 2)])
sys.stdout.write('/* Fond de carte : Natural Earth (domaine public), simplifié par tools/build_world.py. [lon,lat] */\n')
sys.stdout.write('const WORLD=' + json.dumps({'countries': countries, 'lakes': lakes, 'rivers': rivers}, separators=(',', ':'), ensure_ascii=False) + ';\n')
