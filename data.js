/* =========================================================
   Congo Rail Empire — données du monde
   Coordonnées : approximatives (centre-ville), populations : agglomérations en millions (ordre de grandeur).
   Voies : tracés réels simplifiés (une arête = un tronçon entre deux gares). Vitesses et états : estimés pour le jeu.
   ========================================================= */
'use strict';

/* pays : nom, région économique, fuseau (heures UTC) */
const COUNTRIES={
  CD:['RD Congo','AF',1], CG:['Congo-Brazzaville','AF',1], AO:['Angola','AF',1], ZM:['Zambie','AF',2], ZW:['Zimbabwe','AF',2],
  BW:['Botswana','AF',2], ZA:['Afrique du Sud','ZA',2], TZ:['Tanzanie','AF',3], KE:['Kenya','AF',3], UG:['Ouganda','AF',3],
  RW:['Rwanda','AF',2], BI:['Burundi','AF',2], GA:['Gabon','AF',1], CM:['Cameroun','AF',1], ET:['Éthiopie','AF',3], DJ:['Djibouti','AF',3],
  NG:['Nigeria','AF',1], MA:['Maroc','ZA',1], EG:['Égypte','ZA',2],
  FR:['France','EU',1], GB:['Royaume-Uni','EU',0], BE:['Belgique','EU',1], NL:['Pays-Bas','EU',1], DE:['Allemagne','EU',1],
  CH:['Suisse','EU',1], IT:['Italie','EU',1], ES:['Espagne','EU',1], JP:['Japon','JP',9], CN:['Chine','CN',8], US:['États-Unis','US',-5]
};

/* régions économiques :
   fare $/voyageur-km, base $ par billet, K = appétit pour le train (modèle gravitaire), wage = coût du personnel,
   toll = péage $/train-km, build/renov/elec/dbl = M$ par km, energy = prix de l'énergie, frt = $/tonne-km, hub = M$ */
const REGIONS={
  AF:{name:'Afrique',fare:0.05,base:2,K:2.2,wage:0.25,toll:1.5,build:2.0,renov:0.2,elec:0.8,dbl:1.1,energy:1.1,frt:0.08,hub:1.5},
  ZA:{name:'Afrique du Nord & Sud',fare:0.05,base:3,K:1.0,wage:0.5,toll:3,build:4,renov:1,elec:1.2,dbl:2,energy:1,frt:0.05,hub:3},
  EU:{name:'Europe',fare:0.14,base:8,K:6,wage:1,toll:8,build:25,renov:4,elec:1.5,dbl:8,energy:1.2,frt:0.04,hub:12},
  JP:{name:'Japon',fare:0.2,base:10,K:12,wage:1,toll:6,build:60,renov:6,elec:2,dbl:20,energy:1.3,frt:0.04,hub:20},
  CN:{name:'Chine',fare:0.07,base:3,K:8,wage:0.4,toll:4,build:20,renov:3,elec:1,dbl:6,energy:0.9,frt:0.03,hub:10},
  US:{name:'États-Unis',fare:0.25,base:15,K:2,wage:1.2,toll:5,build:40,renov:5,elec:2,dbl:10,energy:1,frt:0.035,hub:15}
};

/* gares : code → {n:nom, la, lo, p:population (M), c:pays, tz?:fuseau particulier, mine?:kt/semaine, port?:attractivité} */
const STATIONS={};
function st(code,n,la,lo,p,c,x){ STATIONS[code]=Object.assign({code,n,la,lo,p,c},x||{}); }
const E2={tz:2};  // RDC orientale (Katanga, Kasaï, Kivu, Province orientale) : UTC+2

/* --- RD Congo : Ouest (Kongo-Central, Kinshasa, Bandundu, Équateur) --- */
st('KIN','Kinshasa',-4.325,15.313,17,'CD',{port:0.5});
st('KSG','Kasangulu',-4.59,15.17,0.05,'CD');
st('INK','Kisantu',-5.13,15.06,0.1,'CD');
st('MBG','Mbanza-Ngungu',-5.25,14.86,0.2,'CD');
st('LKL','Lukala',-5.51,14.53,0.05,'CD',{mine:8,res:'ciment'});
st('KMP','Kimpese',-5.56,14.43,0.1,'CD');
st('SGL','Songololo',-5.70,14.03,0.05,'CD');
st('MAT','Matadi',-5.82,13.46,0.5,'CD',{port:1.0});
st('BOM','Boma',-5.85,13.05,0.3,'CD',{port:0.4});
st('TSH','Tshela',-4.98,12.93,0.05,'CD');
st('MOA','Moanda',-5.93,12.35,0.2,'CD');
st('BAN','Banana',-6.01,12.41,0.05,'CD',{port:1.3});
st('KEN','Kenge',-4.81,16.90,0.1,'CD');
st('KIK','Kikwit',-5.04,18.82,0.6,'CD');
st('MBK','Mbandaka',0.05,18.26,0.5,'CD',{port:0.2});
st('GML','Gemena',3.25,19.77,0.3,'CD');
st('BUM','Bumba',2.18,22.47,0.15,'CD',{port:0.2});
/* --- RD Congo : Kasaï, Katanga, Est --- */
st('ILB','Ilebo',-4.33,20.58,0.15,'CD',{port:0.4,tz:2});
st('MWK','Mweka',-4.85,21.57,0.05,'CD',E2);
st('KGA','Kananga',-5.90,22.42,1.6,'CD',E2);
st('TSK','Tshikapa',-6.42,20.80,0.4,'CD',{tz:2,mine:1,res:'diamants'});
st('MBM','Mbuji-Mayi',-6.14,23.60,2.6,'CD',{tz:2,mine:2,res:'diamants'});
st('MWD','Mwene-Ditu',-7.00,23.45,0.25,'CD',E2);
st('KNM','Kaniama',-7.52,24.18,0.05,'CD',E2);
st('KMN','Kamina',-8.74,24.99,0.15,'CD',E2);
st('BKM','Bukama',-9.20,25.85,0.05,'CD',E2);
st('TNK','Tenke-Fungurume',-10.61,26.13,0.05,'CD',{tz:2,mine:25,res:'cuivre-cobalt'});
st('KWZ','Kolwezi',-10.72,25.47,0.6,'CD',{tz:2,mine:60,res:'cuivre-cobalt'});
st('LKS','Likasi',-10.98,26.73,0.6,'CD',{tz:2,mine:15,res:'cuivre'});
st('LUB','Lubumbashi',-11.66,27.48,2.6,'CD',{tz:2,mine:20,res:'cuivre'});
st('SAK','Sakania',-12.75,28.56,0.03,'CD',E2);
st('MUT','Mutshatsha',-10.65,24.45,0.03,'CD',E2);
st('KSJ','Kasaji',-10.37,23.45,0.03,'CD',E2);
st('DIL','Dilolo',-10.69,22.34,0.05,'CD',E2);
st('KBL','Kabalo',-6.05,26.92,0.05,'CD',E2);
st('NYZ','Nyunzu',-5.95,28.02,0.03,'CD',E2);
st('KLM','Kalemie',-5.93,29.19,0.3,'CD',{tz:2,port:0.3});
st('KGL','Kongolo',-5.38,27.00,0.1,'CD',E2);
st('KBB','Kibombo',-3.90,25.92,0.05,'CD',E2);
st('KND','Kindu',-2.95,25.92,0.3,'CD',{tz:2,port:0.2});
st('UBD','Ubundu',-0.35,25.48,0.05,'CD',{tz:2,port:0.2});
st('KIS','Kisangani',0.52,25.20,1.4,'CD',{tz:2,port:0.3});
st('AKT','Aketi',2.74,23.78,0.05,'CD',E2);
st('BUT','Buta',2.80,24.73,0.1,'CD',E2);
st('ISR','Isiro',2.77,27.62,0.2,'CD',E2);
st('MGB','Mungbere',2.63,28.50,0.03,'CD',E2);
st('BNI','Bunia',1.56,30.25,0.9,'CD',{tz:2,mine:2,res:'or'});
st('BEN','Beni',0.49,29.47,0.4,'CD',E2);
st('BTB','Butembo',0.14,29.29,0.7,'CD',E2);
st('GOM','Goma',-1.68,29.22,0.8,'CD',E2);
st('BKV','Bukavu',-2.51,28.86,1.1,'CD',E2);
st('UVR','Uvira',-3.40,29.14,0.6,'CD',E2);

/* --- Congo-Brazzaville --- */
st('BZV','Brazzaville',-4.27,15.27,2.5,'CG',{port:0.5});
st('MDL','Mindouli',-4.27,14.35,0.03,'CG');
st('LTT','Loutété',-4.29,13.86,0.03,'CG',{mine:5,res:'ciment'});
st('NKY','Nkayi',-4.18,13.29,0.1,'CG');
st('MBL','Mont-Bélo',-4.21,12.95,0.02,'CG');
st('DOL','Dolisie',-4.20,12.67,0.15,'CG');
st('PNR','Pointe-Noire',-4.78,11.86,1.4,'CG',{port:1.0});
st('MKB','Makabana',-3.48,12.60,0.02,'CG');
st('MBD','Mbinda',-2.13,12.88,0.02,'CG');
st('OYO','Oyo',-1.17,15.97,0.03,'CG');
st('OWA','Owando',-0.48,15.90,0.05,'CG');
st('OUS','Ouesso',1.61,16.05,0.08,'CG');

/* --- Afrique australe et de l'Est --- */
st('LOB','Lobito',-12.35,13.55,0.4,'AO',{port:1.1});
st('BGL','Benguela',-12.58,13.41,0.6,'AO');
st('HUA','Huambo',-12.78,15.74,0.7,'AO');
st('KUI','Kuito',-12.38,16.93,0.4,'AO');
st('LUE','Luena',-11.78,19.92,0.3,'AO');
st('LUA','Luau',-10.71,22.23,0.05,'AO');
st('LAD','Luanda',-8.84,13.23,9,'AO',{port:0.8});
st('NDT',"N'dalatando",-9.30,14.91,0.2,'AO');
st('MAL','Malanje',-9.54,16.34,0.5,'AO');
st('NDL','Ndola',-12.97,28.64,0.6,'ZM',{mine:15,res:'cuivre'});
st('KTW','Kitwe',-12.80,28.21,0.7,'ZM',{mine:30,res:'cuivre'});
st('KPM','Kapiri Mposhi',-13.97,28.67,0.1,'ZM');
st('LUN','Lusaka',-15.42,28.28,3.0,'ZM');
st('LVS','Livingstone',-17.85,25.86,0.2,'ZM');
st('MPK','Mpika',-11.83,31.45,0.1,'ZM');
st('NAK','Nakonde',-9.33,32.76,0.05,'ZM');
st('VFL','Victoria Falls',-17.93,25.84,0.04,'ZW');
st('HWG','Hwange',-18.36,26.50,0.04,'ZW',{mine:10,res:'charbon'});
st('BYO','Bulawayo',-20.15,28.58,0.7,'ZW');
st('GWE','Gweru',-19.45,29.82,0.2,'ZW');
st('HRE','Harare',-17.83,31.05,2.1,'ZW');
st('FRT','Francistown',-21.17,27.51,0.1,'BW');
st('GBE','Gaborone',-24.65,25.91,0.3,'BW');
st('MHK','Mahikeng',-25.85,25.64,0.3,'ZA');
st('JNB','Johannesburg',-26.20,28.05,10,'ZA');
st('PRY','Pretoria',-25.75,28.19,2.5,'ZA');
st('KIM','Kimberley',-28.74,24.76,0.25,'ZA');
st('BFW','Beaufort West',-32.35,22.58,0.05,'ZA');
st('CPT','Le Cap',-33.92,18.42,4.7,'ZA',{port:0.8});
st('PMB','Pietermaritzburg',-29.60,30.38,0.7,'ZA');
st('DUR','Durban',-29.86,31.02,3.7,'ZA',{port:1.2});
st('MBY','Mbeya',-8.90,33.46,0.6,'TZ');
st('MKM','Makambako',-8.85,34.83,0.1,'TZ');
st('IFK','Ifakara',-8.13,36.68,0.1,'TZ');
st('DAR','Dar es Salaam',-6.79,39.21,7,'TZ',{port:1.2});
st('MOR','Morogoro',-6.82,37.66,0.4,'TZ');
st('DOD','Dodoma',-6.17,35.74,0.8,'TZ');
st('TAB','Tabora',-5.02,32.80,0.4,'TZ');
st('KGM','Kigoma',-4.88,29.63,0.25,'TZ',{port:0.3});
st('MWZ','Mwanza',-2.52,32.90,1.2,'TZ',{port:0.3});
st('MBA','Mombasa',-4.04,39.67,1.4,'KE',{port:1.0});
st('NBO','Nairobi',-1.29,36.82,5,'KE');
st('NAI','Naivasha',-0.72,36.43,0.2,'KE');
st('NKR','Nakuru',-0.30,36.07,0.6,'KE');
st('KSM','Kisumu',-0.09,34.77,0.6,'KE');
st('MLB','Malaba',0.63,34.28,0.05,'KE');
st('KLA','Kampala',0.35,32.58,3.6,'UG');
st('KSE','Kasese',0.18,30.08,0.1,'UG',{mine:2,res:'cobalt'});
st('KGI','Kigali',-1.95,30.06,1.2,'RW');
st('BJM','Bujumbura',-3.38,29.36,1.1,'BI');
st('OWE','Libreville-Owendo',-0.39,9.47,0.9,'GA',{port:1.0});
st('NDJ','Ndjolé',-0.18,10.76,0.01,'GA');
st('BOO','Booué',-0.10,11.94,0.01,'GA');
st('LTV','Lastoursville',-0.82,12.71,0.02,'GA');
st('MOG','Moanda (Gabon)',-1.57,13.20,0.06,'GA',{mine:80,res:'manganèse'});
st('FCV','Franceville',-1.63,13.58,0.12,'GA');
st('DLA','Douala',4.05,9.70,3.9,'CM',{port:1.0});
st('YAO','Yaoundé',3.87,11.52,4.3,'CM');
st('NGD','Ngaoundéré',7.32,13.58,0.4,'CM');
st('ADD','Addis-Abeba',9.01,38.75,5,'ET');
st('ADA','Adama',8.54,39.27,0.4,'ET');
st('DRD','Dire Dawa',9.60,41.85,0.5,'ET');
st('DJI','Djibouti',11.59,43.15,0.6,'DJ',{port:1.0});
st('LOS','Lagos',6.45,3.39,15,'NG',{port:0.8});
st('IBA','Ibadan',7.38,3.94,3.6,'NG');
st('ABV','Abuja',9.07,7.49,3.5,'NG');
st('KAD','Kaduna',10.52,7.44,1.1,'NG');
/* --- Afrique du Nord --- */
st('TNG','Tanger',35.77,-5.80,1.3,'MA',{port:0.6});
st('KNT','Kénitra',34.26,-6.58,0.5,'MA');
st('RBA','Rabat',34.02,-6.84,1.9,'MA');
st('CAS','Casablanca',33.59,-7.62,4.3,'MA',{port:0.8});
st('RAK','Marrakech',31.63,-8.01,1.0,'MA');
st('FES','Fès',34.03,-5.00,1.2,'MA');
st('ALX','Alexandrie',31.20,29.92,5.4,'EG',{port:0.8});
st('CAI','Le Caire',30.04,31.24,21,'EG');
st('AST','Assiout',27.18,31.19,0.5,'EG');
st('LXR','Louxor',25.69,32.64,0.5,'EG');
st('ASW','Assouan',24.09,32.90,0.3,'EG');
/* --- Europe --- */
st('PAR','Paris',48.857,2.352,11,'FR'); st('LIL','Lille',50.63,3.06,1.2,'FR'); st('LON','Londres',51.53,-0.126,9.5,'GB');
st('BRU','Bruxelles',50.85,4.36,2.1,'BE'); st('AMS','Amsterdam',52.38,4.90,2.4,'NL'); st('CGN','Cologne',50.94,6.96,1.1,'DE');
st('FRA','Francfort',50.11,8.66,2.3,'DE'); st('BER','Berlin',52.52,13.37,3.7,'DE'); st('STR','Strasbourg',48.58,7.73,0.8,'FR');
st('LYS','Lyon',45.76,4.86,2.3,'FR'); st('MRS','Marseille',43.30,5.38,1.8,'FR'); st('BOD','Bordeaux',44.83,-0.56,1.3,'FR');
st('TLS','Toulouse',43.61,1.45,1.4,'FR'); st('MTP','Montpellier',43.60,3.88,0.8,'FR'); st('GVA','Genève',46.21,6.14,0.6,'CH');
st('TRN','Turin',45.07,7.68,1.7,'IT'); st('MIL','Milan',45.49,9.20,3.2,'IT'); st('BOL','Bologne',44.51,11.34,1.0,'IT');
st('FLR','Florence',43.78,11.25,1.0,'IT'); st('ROM','Rome',41.90,12.50,4.3,'IT'); st('NAP','Naples',40.85,14.27,3.0,'IT');
st('BCN','Barcelone',41.38,2.14,5.5,'ES'); st('MAD','Madrid',40.41,-3.69,6.7,'ES');
/* --- Asie, Amérique --- */
st('TYO','Tokyo',35.68,139.77,37,'JP'); st('NGO','Nagoya',35.17,136.88,9,'JP'); st('KYO','Kyoto',34.99,135.76,1.5,'JP');
st('OSA','Osaka',34.73,135.50,19,'JP'); st('HIR','Hiroshima',34.40,132.48,1.4,'JP'); st('FUK','Fukuoka',33.59,130.42,2.6,'JP');
st('PEK','Pékin',39.90,116.38,21,'CN'); st('JNN','Jinan',36.65,117.12,9,'CN'); st('NKG','Nankin',32.06,118.80,9,'CN');
st('SHA','Shanghai',31.23,121.47,26,'CN'); st('WUH','Wuhan',30.59,114.31,11,'CN'); st('CAN','Canton',23.13,113.26,18,'CN');
st('SZX','Shenzhen',22.54,114.06,17,'CN'); st('HKG','Hong Kong',22.30,114.17,7.5,'CN');
st('BOS','Boston',42.35,-71.06,4.9,'US'); st('NYC','New York',40.75,-73.99,20,'US'); st('PHL','Philadelphie',39.96,-75.18,6.2,'US');
st('WAS','Washington',38.90,-77.01,6.3,'US');

/* écartements : C = voie du Cap 1067 mm (Afrique australe et centrale), M = voie métrique 1000 mm, S = voie normale 1435 mm */
const GAUGES={C:'Voie du Cap (1067 mm)',M:'Voie métrique (1000 mm)',S:'Voie normale (1435 mm)'};

/* voies existantes : [a, b, vitesse limite km/h, écartement, électrifiée, nb de voies, opts]
   opts : hs = hors service (à réhabiliter), ferry = bac ferroviaire, km = longueur imposée, op = gestionnaire */
const TRACKS=[];
function tk(list,v,g,el,tr,o){ for(let i=0;i<list.length-1;i++) TRACKS.push([list[i],list[i+1],v,g,!!el,tr||1,o||{}]); }
// RDC — Matadi–Kinshasa (SCTP, ex-ONATRA), voie du Cap, usée
tk(['MAT','SGL','KMP','LKL','MBG','INK','KSG','KIN'],45,'C',0,1,{op:'SCTP'});
// RDC — réseau SNCC (Katanga, Kasaï, Maniema) : ancien et dégradé
tk(['SAK','LUB','LKS'],50,'C',0,1,{op:'SNCC'});
tk(['LKS','TNK','KWZ'],45,'C',0,1,{op:'SNCC'});
tk(['KWZ','MUT','KSJ','DIL'],30,'C',0,1,{op:'SNCC'});
tk(['DIL','LUA'],30,'C',0,1,{op:'SNCC'});
tk(['TNK','BKM','KMN'],35,'C',0,1,{op:'SNCC'});
tk(['KMN','KNM','MWD','KGA'],30,'C',0,1,{op:'SNCC'});
tk(['KGA','MWK','ILB'],25,'C',0,1,{op:'SNCC'});
tk(['KMN','KBL','NYZ','KLM'],25,'C',0,1,{op:'SNCC'});
tk(['KBL','KGL','KBB','KND'],20,'C',0,1,{op:'SNCC'});
tk(['KIS','UBD'],25,'M',0,1,{op:'SNCC'});
// RDC — anciennes lignes à rouvrir
tk(['BUM','AKT','ISR','MGB'],0,'C',0,1,{hs:1,op:'CFU'});
tk(['AKT','BUT'],0,'C',0,1,{hs:1,op:'CFU'});
tk(['BOM','TSH'],0,'C',0,1,{hs:1,op:'Mayumbe'});
// Lac Tanganyika : bac ferroviaire Kalemie ↔ Kigoma
TRACKS.push(['KLM','KGM',15,'*',false,1,{ferry:1,km:140,op:'Bac'}]);
// Congo-Brazzaville — Chemin de fer Congo-Océan (CFCO), ligne COMILOG
tk(['PNR','DOL','MBL','NKY','LTT','MDL','BZV'],45,'C',0,1,{op:'CFCO'});
tk(['MBL','MKB','MBD'],0,'C',0,1,{hs:1,op:'COMILOG'});
// Angola — Chemin de fer de Benguela (corridor de Lobito), ligne de Luanda
tk(['LOB','HUA','KUI','LUE','LUA'],80,'C',0,1,{op:'CFB'});
tk(['LOB','BGL'],60,'C',0,1,{op:'CFB'});
tk(['LAD','NDT','MAL'],70,'C',0,1,{op:'CFL'});
// Zambie, Zimbabwe, Botswana, Afrique du Sud
tk(['SAK','NDL','KTW'],60,'C',0,1,{op:'ZRL'});
tk(['NDL','KPM','LUN','LVS'],70,'C',0,1,{op:'ZRL'});
tk(['LVS','VFL'],40,'C',0,1,{op:'ZRL'});
tk(['VFL','HWG','BYO','GWE','HRE'],60,'C',0,1,{op:'NRZ'});
tk(['BYO','FRT','GBE','MHK'],80,'C',0,1,{op:'BR'});
tk(['MHK','JNB'],90,'C',1,1,{op:'Transnet'});
tk(['JNB','PRY'],120,'C',1,2,{op:'Transnet'});
tk(['JNB','PRY'],160,'S',1,2,{op:'Gautrain'});
tk(['JNB','KIM','BFW','CPT'],100,'C',1,2,{op:'Transnet'});
tk(['JNB','PMB','DUR'],90,'C',1,2,{op:'Transnet'});
// TAZARA et Tanzanie (ligne centrale métrique + nouvelle ligne SGR à voie normale électrifiée)
tk(['KPM','MPK','NAK','MBY','MKM','IFK','DAR'],60,'C',0,1,{op:'TAZARA'});
tk(['DAR','MOR','DOD','TAB','KGM'],55,'M',0,1,{op:'TRC'});
tk(['TAB','MWZ'],50,'M',0,1,{op:'TRC'});
tk(['DAR','MOR','DOD'],160,'S',1,2,{op:'TRC'});
// Kenya, Ouganda
tk(['MBA','NBO','NAI'],120,'S',0,1,{op:'Kenya Railways'});
tk(['NBO','NKR','KSM'],50,'M',0,1,{op:'Kenya Railways'});
tk(['NKR','MLB','KLA'],40,'M',0,1,{op:'Kenya Railways'});
tk(['KLA','KSE'],0,'M',0,1,{hs:1,op:'URC'});
// Gabon, Cameroun, Éthiopie–Djibouti, Nigeria
tk(['OWE','NDJ','BOO','LTV','MOG','FCV'],80,'S',0,1,{op:'SETRAG'});
tk(['DLA','YAO','NGD'],60,'M',0,1,{op:'Camrail'});
tk(['ADD','ADA','DRD','DJI'],120,'S',1,1,{op:'EDR'});
tk(['LOS','IBA'],120,'S',0,2,{op:'NRC'});
tk(['ABV','KAD'],120,'S',0,1,{op:'NRC'});
// Maroc, Égypte
tk(['TNG','KNT'],320,'S',1,2,{op:'ONCF'});
tk(['KNT','RBA','CAS','RAK'],160,'S',1,2,{op:'ONCF'});
tk(['KNT','FES'],140,'S',1,2,{op:'ONCF'});
tk(['ALX','CAI'],140,'S',0,2,{op:'ENR'});
tk(['CAI','AST','LXR','ASW'],110,'S',0,2,{op:'ENR'});
// Europe
tk(['LON','LIL','PAR'],300,'S',1,2,{op:'LGV'}); tk(['LIL','BRU','AMS'],280,'S',1,2,{op:'LGV'});
tk(['BRU','CGN','FRA','BER'],250,'S',1,2,{op:'DB'}); tk(['PAR','STR'],320,'S',1,2,{op:'LGV'}); tk(['STR','FRA'],160,'S',1,2,{op:'DB'});
tk(['PAR','LYS','MRS'],300,'S',1,2,{op:'LGV'}); tk(['LYS','MTP','BCN','MAD'],300,'S',1,2,{op:'LGV'});
tk(['PAR','BOD'],320,'S',1,2,{op:'LGV'}); tk(['BOD','TLS','MTP'],160,'S',1,2,{op:'SNCF Réseau'});
tk(['LYS','GVA'],160,'S',1,2,{op:'SNCF Réseau'}); tk(['LYS','TRN'],160,'S',1,2,{op:'SNCF Réseau'});
tk(['TRN','MIL','BOL','FLR','ROM','NAP'],300,'S',1,2,{op:'RFI'});
// Japon, Chine, États-Unis
tk(['TYO','NGO','KYO','OSA'],285,'S',1,2,{op:'Shinkansen'}); tk(['OSA','HIR','FUK'],300,'S',1,2,{op:'Shinkansen'});
tk(['PEK','JNN','NKG','SHA'],350,'S',1,2,{op:'CR'}); tk(['PEK','WUH','CAN','SZX'],330,'S',1,2,{op:'CR'});
tk(['NKG','WUH'],300,'S',1,2,{op:'CR'}); tk(['SZX','HKG'],200,'S',1,2,{op:'CR'});
tk(['BOS','NYC','PHL','WAS'],200,'S',1,2,{op:'Amtrak'});

/* grands projets suggérés (réels ou discutés depuis longtemps ; coûts du jeu = estimations) */
const PROJECTS=[
  {name:'Pont route-rail Kinshasa–Brazzaville',path:['KIN','BZV'],g:'C',v:80,km:8,extra:450,note:'Relier les deux capitales les plus proches du monde par-dessus le fleuve Congo.'},
  {name:'Chaînon manquant Kinshasa–Ilebo',path:['KIN','KEN','KIK','ILB'],g:'C',v:100,note:'Le rêve historique : relier Kinshasa au réseau du Katanga sans passer par le fleuve.'},
  {name:'Ubundu–Kindu (boucle du Lualaba)',path:['UBD','KND'],g:'C',v:80,note:'Relier Kisangani au réseau national. Attention : Kisangani–Ubundu est en voie métrique.'},
  {name:'Port en eau profonde de Banana',path:['MAT','BOM','MOA','BAN'],g:'C',v:100,note:'Prolonger la ligne de Matadi jusqu\'à l\'océan.'},
  {name:'Mwene-Ditu–Mbuji-Mayi',path:['MWD','MBM'],g:'C',v:100,note:'Desservir la 2e ou 3e ville du pays, sans rail aujourd\'hui.'},
  {name:'Kananga–Tshikapa',path:['KGA','TSK'],g:'C',v:100,note:'Le Kasaï diamantifère.'},
  {name:'Kisangani–Buta (vers les Uele)',path:['KIS','BUT'],g:'C',v:80,note:'Rejoindre l\'ancien réseau des Uele.'},
  {name:'Corridor des Grands Lacs (Goma–Bukavu–Uvira)',path:['GOM','BKV','UVR','BJM'],g:'C',v:80,note:'L\'Est sans chemin de fer : un énorme marché.'},
  {name:'Goma–Kigali',path:['GOM','KGI'],g:'S',v:120,note:'Se raccorder au futur réseau à voie normale de l\'Afrique de l\'Est.'},
  {name:'Kasese–Beni–Bunia',path:['KSE','BEN','BNI'],g:'M',v:80,note:'Prolonger le réseau ougandais vers l\'Ituri.'},
  {name:'Butembo–Goma',path:['BEN','BTB','GOM'],g:'C',v:80,note:'Le Nord-Kivu.'},
  {name:'Brazzaville–Oyo–Ouesso',path:['BZV','OYO','OWA','OUS'],g:'C',v:100,note:'Le nord du Congo-Brazzaville.'},
  {name:'Kinshasa–Mbandaka',path:['KIN','MBK'],g:'C',v:100,note:'Long, à travers la forêt : très cher.'}
];

/* matériel roulant : g = écartement, el = électrique, seats/cap, vmax km/h, acc m/s², price M$, epk = énergie $/km, crew = agents */
const MODELS={
  AUT_C:{name:'Autorail diesel',g:'C',kind:'pax',seats:160,vmax:100,acc:0.6,price:5,epk:4,crew:3},
  PAX_C:{name:'Train voyageurs (loco + 10 voitures)',g:'C',kind:'pax',seats:700,vmax:90,acc:0.25,price:12,epk:7,crew:6},
  NUIT_C:{name:'Express couchettes',g:'C',kind:'pax',seats:360,vmax:100,acc:0.3,price:16,epk:8,crew:7,comfort:1.5},
  EMU_C:{name:'Automotrice électrique',g:'C',el:1,kind:'pax',seats:520,vmax:120,acc:0.7,price:15,epk:3,crew:3},
  FRT_C:{name:'Fret diesel (2 locos, 40 wagons)',g:'C',kind:'frt',cap:1800,vmax:70,acc:0.15,price:11,epk:14,crew:3},
  FRE_C:{name:'Fret électrique minerais',g:'C',el:1,kind:'frt',cap:2600,vmax:80,acc:0.2,price:15,epk:6,crew:2},
  AUT_M:{name:'Autorail métrique',g:'M',kind:'pax',seats:140,vmax:80,acc:0.6,price:4,epk:4,crew:3},
  PAX_M:{name:'Train voyageurs métrique',g:'M',kind:'pax',seats:500,vmax:70,acc:0.25,price:9,epk:8,crew:6},
  FRT_M:{name:'Fret métrique',g:'M',kind:'frt',cap:1200,vmax:60,acc:0.15,price:8,epk:11,crew:3},
  REG_S:{name:'Automotrice régionale',g:'S',el:1,kind:'pax',seats:300,vmax:160,acc:0.9,price:10,epk:5,crew:2},
  SGR_S:{name:'Grandes lignes diesel (type SGR)',g:'S',kind:'pax',seats:1100,vmax:120,acc:0.3,price:25,epk:14,crew:8},
  IC_S:{name:'Intercités électrique',g:'S',el:1,kind:'pax',seats:600,vmax:200,acc:0.5,price:22,epk:9,crew:4},
  TGV_S:{name:'Grande vitesse 320',g:'S',el:1,kind:'pax',seats:510,vmax:320,acc:0.45,price:35,epk:16,crew:4},
  HSX_S:{name:'Grande vitesse 16 voitures',g:'S',el:1,kind:'pax',seats:1300,vmax:300,acc:0.4,price:60,epk:28,crew:8},
  FRT_S:{name:'Fret diesel voie normale',g:'S',kind:'frt',cap:3000,vmax:100,acc:0.15,price:14,epk:16,crew:2},
  FRE_S:{name:'Fret électrique voie normale',g:'S',el:1,kind:'frt',cap:4000,vmax:100,acc:0.2,price:18,epk:7,crew:2}
};

/* opérateurs concurrents (noms réels ; horaires et chiffres du jeu = fictifs) : [opérateur, origine, destination, modèle, A/R par semaine, heure locale] */
const RIVAL_LINES=[
  ['SCTP','KIN','MAT','PAX_C',2,7],
  ['SNCC','LUB','KWZ','PAX_C',2,8],['SNCC','LUB','KGA','PAX_C',1,9],['SNCC','LUB','KLM','PAX_C',1,10],['SNCC','KWZ','DAR','FRT_C',2,4],
  ['SNCC','LUB','KND','PAX_C',1,11],['SNCC','KIS','UBD','AUT_M',2,8],
  ['Lobito Atlantic Railway','KWZ','LOB','FRT_C',5,6],['Lobito Atlantic Railway','LOB','HUA','PAX_C',3,7],['CFB','LOB','LUA','PAX_C',2,6],
  ['CFCO','PNR','BZV','PAX_C',3,7],['CFCO','LTT','PNR','FRT_C',3,5],
  ['TAZARA','DAR','KPM','PAX_C',2,13],['TAZARA','NDL','DAR','FRT_C',3,9],['ZRL','LUN','LVS','PAX_C',2,19],['ZRL','KTW','LUN','PAX_C',3,8],
  ['TRC','DAR','DOD','IC_S',14,6],['TRC','DAR','KGM','PAX_M',2,17],['Kenya Railways','MBA','NBO','SGR_S',14,8],
  ['SETRAG','OWE','FCV','SGR_S',4,7],['SETRAG','MOG','OWE','FRT_S',14,3],['Camrail','DLA','YAO','PAX_M',7,7],
  ['EDR','ADD','DJI','SGR_S',4,8],['NRC','LOS','IBA','SGR_S',14,7],['Shosholoza Meyl','JNB','CPT','PAX_C',2,10],['Transnet','KTW','DUR','FRT_C',3,6],
  ['Gautrain','JNB','PRY','REG_S',140,5],['ONCF','TNG','CAS','TGV_S',63,6],['ONCF','CAS','RAK','IC_S',28,6],['ENR','CAI','ASW','SGR_S',7,8],
  ['SNCF','PAR','LYS','HSX_S',140,6],['SNCF','PAR','MRS','TGV_S',63,6],['SNCF','PAR','BOD','TGV_S',105,6],['Eurostar','PAR','LON','TGV_S',105,6],
  ['DB','FRA','BER','IC_S',70,6],['Renfe','MAD','BCN','TGV_S',105,6],['Trenitalia','MIL','ROM','TGV_S',140,6],
  ['JR Central','TYO','OSA','HSX_S',700,6],['CR','PEK','SHA','HSX_S',700,6],['CR','PEK','CAN','HSX_S',280,7],['Amtrak','BOS','WAS','IC_S',112,6]
];

/* hubs proposés au départ */
const START_HUBS=['KIN','LUB','BZV','PNR','KWZ','KGA','KIS','MAT','DAR','JNB','PAR'];
