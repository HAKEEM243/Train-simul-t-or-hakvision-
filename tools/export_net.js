// Exporte gares et voies du jeu en JSON (pour tools/build_rails.py) : node tools/export_net.js > net.json
const fs=require('fs'),vm=require('vm'),path=require('path'); const c={console}; vm.createContext(c);
for(const f of ['data.js','data-world.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c);
vm.runInContext(`console.log(JSON.stringify({stations:Object.fromEntries(Object.values(STATIONS).map(s=>[s.code,[s.la,s.lo]])),tracks:TRACKS.map(t=>[t[0],t[1],!!t[6].ferry])}))`,c);
