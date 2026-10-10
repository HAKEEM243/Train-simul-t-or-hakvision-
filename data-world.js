/* =========================================================
   Hakvision Rail — le reste du monde : pays, gares et voies (réseaux réels simplifiés).
   Chargé après data.js. Coordonnées et populations approximatives ; vitesses estimées pour le jeu.
   ========================================================= */
'use strict';
Object.assign(REGIONS,{
  IN:{name:'Inde',fare:0.015,base:0.5,K:10,wage:0.2,toll:1,build:6,renov:0.4,elec:0.6,dbl:2,energy:0.9,frt:0.03,hub:2},
  RU:{name:'Russie',fare:0.04,base:3,K:3,wage:0.4,toll:3,build:8,renov:1,elec:1,dbl:3,energy:0.7,frt:0.025,hub:4},
  LA:{name:'Amérique latine',fare:0.05,base:3,K:2,wage:0.4,toll:2,build:6,renov:0.8,elec:1,dbl:3,energy:1,frt:0.04,hub:4},
  ME:{name:'Moyen-Orient',fare:0.1,base:10,K:2,wage:0.8,toll:5,build:20,renov:3,elec:1.5,dbl:6,energy:0.5,frt:0.04,hub:10},
  OC:{name:'Océanie',fare:0.15,base:10,K:1.5,wage:1.1,toll:6,build:30,renov:4,elec:2,dbl:8,energy:1.1,frt:0.04,hub:12},
  AS:{name:'Asie',fare:0.08,base:4,K:6,wage:0.5,toll:4,build:20,renov:3,elec:1,dbl:6,energy:1,frt:0.035,hub:8}
});
Object.assign(COUNTRIES,{
  LU:['Luxembourg','EU',1],AT:['Autriche','EU',1],PL:['Pologne','EU',1],CZ:['Tchéquie','EU',1],SK:['Slovaquie','EU',1],HU:['Hongrie','EU',1],
  DK:['Danemark','EU',1],SE:['Suède','EU',1],NO:['Norvège','EU',1],FI:['Finlande','EU',2],RO:['Roumanie','EU',2],BG:['Bulgarie','EU',2],
  RS:['Serbie','EU',1],HR:['Croatie','EU',1],SI:['Slovénie','EU',1],GR:['Grèce','EU',2],PT:['Portugal','EU',0],TR:['Turquie','ME',3],
  RU:['Russie','RU',3],BY:['Biélorussie','RU',3],MN:['Mongolie','RU',8],KR:['Corée du Sud','JP',9],TH:['Thaïlande','AS',7],LA:['Laos','AS',7],
  MY:['Malaisie','AS',8],SG:['Singapour','AS',8],VN:['Viêt Nam','AS',7],IN:['Inde','IN',5.5],SA:['Arabie saoudite','ME',3],
  CA:['Canada','US',-5],MX:['Mexique','LA',-6],AR:['Argentine','LA',-3],BR:['Brésil','LA',-3],CL:['Chili','LA',-4],PE:['Pérou','LA',-5],BO:['Bolivie','LA',-4],
  AU:['Australie','OC',10],NZ:['Nouvelle-Zélande','OC',12],SN:['Sénégal','AF',0],ML:['Mali','AF',0],CI:["Côte d'Ivoire",'AF',0],BF:['Burkina Faso','AF',0],
  GH:['Ghana','AF',0],DZ:['Algérie','ZA',1],TN:['Tunisie','ZA',1],SD:['Soudan','AF',2],MZ:['Mozambique','AF',2],MW:['Malawi','AF',2],NA:['Namibie','AF',2]
});
/* ---------- Afrique (compléments) ---------- */
st('DKR','Dakar',14.69,-17.44,3.9,'SN',{port:0.9}); st('THI','Thiès',14.79,-16.93,0.4,'SN'); st('TBA','Tambacounda',13.77,-13.67,0.1,'SN');
st('KAY','Kayes',14.45,-11.44,0.13,'ML'); st('BKO','Bamako',12.64,-8.0,2.8,'ML');
st('ABJ','Abidjan',5.32,-4.03,5.6,'CI',{port:1.0}); st('BKE','Bouaké',7.69,-5.03,0.8,'CI'); st('OUA','Ouagadougou',12.37,-1.52,2.9,'BF');
st('ACC','Accra',5.56,-0.2,2.5,'GH',{port:0.8}); st('KMS','Kumasi',6.69,-1.62,3.3,'GH',{mine:5,res:'or'});
st('ALG','Alger',36.75,3.06,3.9,'DZ',{port:0.8}); st('ORN','Oran',35.7,-0.63,1.6,'DZ'); st('CZL','Constantine',36.37,6.61,1.0,'DZ'); st('ANB','Annaba',36.9,7.77,0.6,'DZ');
st('TUN','Tunis',36.8,10.18,2.7,'TN',{port:0.7}); st('SFA','Sfax',34.74,10.76,1.0,'TN',{mine:15,res:'phosphate'});
st('KRT','Khartoum',15.5,32.56,6,'SD'); st('ATB','Atbara',17.7,33.98,0.15,'SD'); st('PZU','Port-Soudan',19.62,37.22,0.5,'SD',{port:0.8});
st('MPM','Maputo',-25.97,32.57,1.8,'MZ',{port:1.0}); st('BEW','Beira',-19.84,34.84,0.6,'MZ',{port:0.9}); st('MOZ','Moatize',-16.12,33.74,0.1,'MZ',{mine:60,res:'charbon'});
st('NCA','Nacala',-14.54,40.67,0.25,'MZ',{port:1.0}); st('BLZ','Blantyre',-15.79,35.0,1.0,'MW');
st('WDH','Windhoek',-22.56,17.08,0.45,'NA'); st('WVB','Walvis Bay',-22.96,14.51,0.1,'NA',{port:0.8});
st('ILR','Ilorin',8.5,4.55,1.0,'NG'); st('MNA','Minna',9.61,6.56,0.5,'NG'); st('KAN','Kano',12.0,8.52,4.1,'NG');
/* ---------- Europe (compléments) ---------- */
st('MET','Metz',49.11,6.18,0.4,'FR'); st('REI','Reims',49.26,4.03,0.3,'FR'); st('LMS','Le Mans',48.0,0.19,0.3,'FR'); st('RNS','Rennes',48.1,-1.67,0.7,'FR');
st('NTE','Nantes',47.22,-1.54,1.0,'FR'); st('TRS','Tours',47.39,0.69,0.5,'FR'); st('PTS','Poitiers',46.58,0.34,0.3,'FR'); st('BAY','Bayonne',43.49,-1.47,0.3,'FR');
st('NCE','Nice',43.7,7.26,1.0,'FR'); st('GNB','Grenoble',45.19,5.71,0.7,'FR'); st('CFE','Clermont-Ferrand',45.78,3.09,0.5,'FR'); st('DIJ','Dijon',47.32,5.03,0.4,'FR');
st('ROU','Rouen',49.44,1.09,0.7,'FR'); st('LEH','Le Havre',49.49,0.11,0.3,'FR',{port:0.9}); st('AVG','Avignon',43.92,4.79,0.5,'FR');
st('BHM','Birmingham',52.48,-1.9,2.9,'GB'); st('MCR','Manchester',53.48,-2.24,2.8,'GB'); st('LIV','Liverpool',53.41,-2.98,0.9,'GB',{port:0.7}); st('LDS','Leeds',53.8,-1.55,1.9,'GB');
st('NCL','Newcastle',54.97,-1.61,0.8,'GB'); st('EDI','Édimbourg',55.95,-3.19,0.9,'GB'); st('GLA','Glasgow',55.86,-4.25,1.7,'GB'); st('BRS','Bristol',51.45,-2.58,0.7,'GB'); st('CWL','Cardiff',51.48,-3.18,0.5,'GB');
st('RTM','Rotterdam',51.92,4.47,1.0,'NL',{port:1.2}); st('ANR','Anvers',51.22,4.4,1.0,'BE',{port:1.1}); st('UTR','Utrecht',52.09,5.11,0.6,'NL'); st('LGG','Liège',50.62,5.57,0.6,'BE'); st('LUX','Luxembourg',49.6,6.13,0.6,'LU');
st('HAM','Hambourg',53.55,10.0,3.2,'DE',{port:1.2}); st('HAJ','Hanovre',52.38,9.74,1.1,'DE'); st('BRE','Brême',53.08,8.81,0.6,'DE'); st('DUS','Düsseldorf',51.23,6.78,1.2,'DE');
st('DTM','Dortmund',51.51,7.47,1.0,'DE'); st('MHG','Mannheim',49.48,8.47,0.8,'DE'); st('STG','Stuttgart',48.78,9.18,2.8,'DE'); st('MUC','Munich',48.14,11.56,2.9,'DE');
st('NUE','Nuremberg',49.45,11.08,1.3,'DE'); st('LEJ','Leipzig',51.34,12.37,1.0,'DE'); st('DRS','Dresde',51.05,13.74,0.8,'DE');
st('BSL','Bâle',47.55,7.59,0.8,'CH'); st('ZRH','Zurich',47.38,8.54,1.4,'CH'); st('BRN','Berne',46.95,7.44,0.4,'CH'); st('LSN','Lausanne',46.52,6.63,0.4,'CH');
st('VIE','Vienne',48.21,16.37,2.9,'AT'); st('SZG','Salzbourg',47.81,13.04,0.4,'AT'); st('INN','Innsbruck',47.26,11.4,0.3,'AT'); st('GRZ','Graz',47.07,15.44,0.6,'AT');
st('VRN','Vérone',45.44,10.99,0.7,'IT'); st('VCE','Venise',45.44,12.32,0.6,'IT'); st('GOA','Gênes',44.41,8.93,0.8,'IT',{port:0.9}); st('BRI','Bari',41.12,16.87,1.2,'IT'); st('RCL','Reggio de Calabre',38.11,15.65,0.5,'IT');
st('SVQ','Séville',37.39,-5.98,1.5,'ES'); st('ODB','Cordoue',37.89,-4.78,0.3,'ES'); st('AGP','Málaga',36.72,-4.42,1.0,'ES'); st('VLC','Valence',39.47,-0.38,1.6,'ES',{port:0.8});
st('ZAZ','Saragosse',41.65,-0.88,0.7,'ES'); st('BIO','Bilbao',43.26,-2.93,1.0,'ES',{port:0.7}); st('LIS','Lisbonne',38.72,-9.14,2.9,'PT',{port:0.8}); st('OPO','Porto',41.15,-8.61,1.7,'PT');
st('CPH','Copenhague',55.68,12.57,2.1,'DK'); st('MMA','Malmö',55.6,13.0,0.7,'SE'); st('GOT','Göteborg',57.71,11.97,1.0,'SE',{port:0.8}); st('STO','Stockholm',59.33,18.06,2.4,'SE');
st('OSL','Oslo',59.91,10.75,1.1,'NO'); st('BGO','Bergen',60.39,5.32,0.4,'NO');
st('POZ','Poznań',52.41,16.93,0.9,'PL'); st('WAW','Varsovie',52.23,21.01,3.1,'PL'); st('KRK','Cracovie',50.06,19.94,1.4,'PL'); st('GDN','Gdańsk',54.35,18.65,1.1,'PL',{port:0.8}); st('WRO','Wrocław',51.11,17.03,1.0,'PL');
st('PRG','Prague',50.08,14.43,2.2,'CZ'); st('BRQ','Brno',49.2,16.61,0.7,'CZ'); st('BTS','Bratislava',48.15,17.11,0.7,'SK'); st('BUD','Budapest',47.5,19.04,3.0,'HU');
st('BUH','Bucarest',44.43,26.1,2.3,'RO'); st('SOF','Sofia',42.7,23.32,1.6,'BG'); st('BEG','Belgrade',44.79,20.45,1.7,'RS'); st('ZAG','Zagreb',45.81,15.98,1.1,'HR'); st('LJU','Ljubljana',46.06,14.51,0.5,'SI');
st('THS','Thessalonique',40.64,22.94,1.0,'GR'); st('ATH','Athènes',37.98,23.73,3.6,'GR',{port:0.8});
st('IST','Istanbul',41.01,28.98,15.5,'TR',{port:0.9}); st('ANK','Ankara',39.93,32.86,5.7,'TR'); st('KNY','Konya',37.87,32.49,1.3,'TR');
/* ---------- Russie, Biélorussie, Finlande, Mongolie ---------- */
st('HEL','Helsinki',60.17,24.94,1.5,'FI'); st('LED','Saint-Pétersbourg',59.93,30.36,5.4,'RU',{port:0.8}); st('MOW','Moscou',55.76,37.62,17,'RU');
st('NNV','Nijni Novgorod',56.33,44.0,1.2,'RU'); st('KZN','Kazan',55.79,49.12,1.3,'RU'); st('SVX','Iekaterinbourg',56.84,60.6,1.5,'RU',{mine:20,res:'métaux'});
st('OMS','Omsk',54.99,73.37,1.1,'RU'); st('NSK','Novossibirsk',55.03,82.92,1.6,'RU'); st('KJA','Krasnoïarsk',56.01,92.85,1.1,'RU'); st('IKT','Irkoutsk',52.29,104.28,0.6,'RU');
st('UUD','Oulan-Oudé',51.83,107.58,0.4,'RU'); st('CHT','Tchita',52.03,113.5,0.35,'RU'); st('KHV','Khabarovsk',48.48,135.08,0.6,'RU'); st('VVO','Vladivostok',43.12,131.89,0.6,'RU',{port:0.9});
st('ZBK','Zabaïkalsk',49.65,117.33,0.01,'RU'); st('MSQ','Minsk',53.9,27.56,2.0,'BY'); st('BST','Brest',52.09,23.69,0.35,'BY');
st('ULN','Oulan-Bator',47.92,106.92,1.6,'MN',{mine:10,res:'cuivre-charbon'}); st('ZMU','Zamyn-Üüd',43.72,111.9,0.02,'MN');
/* ---------- Asie ---------- */
st('TSN','Tianjin',39.13,117.2,14,'CN',{port:1.0}); st('SHE','Shenyang',41.8,123.43,9,'CN'); st('HRB','Harbin',45.8,126.53,10,'CN'); st('MZL','Manzhouli',49.6,117.38,0.3,'CN');
st('ERL','Erenhot',43.65,111.98,0.1,'CN'); st('ZZH','Zhengzhou',34.75,113.63,12,'CN'); st('XIY',"Xi'an",34.34,108.94,13,'CN'); st('CTU','Chengdu',30.66,104.06,21,'CN');
st('CKG','Chongqing',29.56,106.55,16,'CN'); st('KMG','Kunming',25.04,102.71,8,'CN'); st('HGH','Hangzhou',30.27,120.15,12,'CN'); st('CSX','Changsha',28.23,112.94,10,'CN');
st('SDJ','Sendai',38.27,140.87,1.1,'JP'); st('NII','Niigata',37.92,139.04,0.8,'JP'); st('NGN','Nagano',36.65,138.18,0.4,'JP'); st('KNZ','Kanazawa',36.56,136.66,0.5,'JP'); st('KOJ','Kagoshima',31.6,130.56,0.6,'JP');
st('SEL','Séoul',37.55,126.97,25,'KR'); st('DJN','Daejeon',36.35,127.38,1.5,'KR'); st('DGU','Daegu',35.87,128.6,2.4,'KR'); st('PUS','Busan',35.18,129.08,3.4,'KR',{port:1.1});
st('VTE','Vientiane',17.97,102.6,0.9,'LA'); st('BKK','Bangkok',13.75,100.5,10.7,'TH',{port:0.8}); st('KUL','Kuala Lumpur',3.14,101.69,8,'MY'); st('SIN','Singapour',1.29,103.85,5.9,'SG',{port:1.3});
st('HAN','Hanoï',21.03,105.85,8,'VN'); st('SGN','Hô Chi Minh-Ville',10.78,106.7,9,'VN',{port:0.8});
st('DEL','Delhi',28.64,77.22,32,'IN'); st('AGR','Agra',27.18,78.01,1.9,'IN'); st('JAI','Jaipur',26.92,75.79,4,'IN'); st('AMD','Ahmedabad',23.02,72.57,8,'IN');
st('MUM','Mumbai',18.94,72.84,21,'IN',{port:1.0}); st('PNQ','Pune',18.52,73.86,7,'IN'); st('BHO','Bhopal',23.26,77.41,2.4,'IN'); st('NAG','Nagpur',21.15,79.09,2.9,'IN');
st('HYD','Hyderabad',17.39,78.49,10,'IN'); st('BLR','Bangalore',12.97,77.59,13,'IN'); st('MAA','Chennai',13.08,80.27,11,'IN',{port:0.9}); st('LKO','Lucknow',26.85,80.95,3.8,'IN');
st('VNS','Varanasi',25.32,82.97,1.6,'IN'); st('PAT','Patna',25.59,85.14,2.3,'IN'); st('GAY','Gaya',24.79,85.0,0.5,'IN'); st('DHN','Dhanbad',23.8,86.43,1.2,'IN',{mine:120,res:'charbon'}); st('CCU','Calcutta',22.57,88.36,15,'IN',{port:0.9});
st('RUH','Riyad',24.71,46.68,7.5,'SA'); st('DMM','Dammam',26.43,50.1,1.3,'SA',{port:0.9}); st('MED','Médine',24.47,39.61,1.5,'SA'); st('JED','Djeddah',21.49,39.19,4.7,'SA',{port:1.0}); st('MEC','La Mecque',21.42,39.83,2.4,'SA');
/* ---------- Amérique du Nord ---------- */
st('ALB','Albany',42.65,-73.75,0.9,'US'); st('BUF','Buffalo',42.89,-78.88,1.1,'US'); st('CLE','Cleveland',41.5,-81.69,2.0,'US'); st('CHI','Chicago',41.88,-87.63,9.5,'US');
st('PIT','Pittsburgh',40.44,-79.99,2.4,'US'); st('RIC','Richmond',37.54,-77.44,1.3,'US'); st('CLT','Charlotte',35.23,-80.84,2.7,'US'); st('ATL','Atlanta',33.75,-84.39,6.1,'US');
st('NOL','La Nouvelle-Orléans',29.95,-90.07,1.3,'US',{port:1.0}); st('HOU','Houston',29.76,-95.37,7.1,'US',{port:1.1}); st('DAL','Dallas',32.78,-96.8,7.6,'US'); st('SAT','San Antonio',29.42,-98.49,2.6,'US');
st('ELP','El Paso',31.76,-106.49,0.9,'US'); st('TUS','Tucson',32.22,-110.97,1.0,'US'); st('LAX','Los Angeles',34.05,-118.24,13,'US',{port:1.2}); st('SAN','San Diego',32.72,-117.16,3.3,'US');
st('SFO','San Francisco',37.77,-122.42,4.7,'US',{port:0.9}); st('SAC','Sacramento',38.58,-121.49,2.4,'US'); st('RNO','Reno',39.53,-119.81,0.5,'US'); st('SLC','Salt Lake City',40.76,-111.89,1.3,'US');
st('DEN','Denver',39.74,-104.99,3.0,'US'); st('KCI','Kansas City',39.1,-94.58,2.2,'US'); st('STL','Saint-Louis',38.63,-90.2,2.8,'US'); st('MSP','Minneapolis',44.98,-93.27,3.7,'US');
st('SPK','Spokane',47.66,-117.43,0.6,'US'); st('SEA','Seattle',47.61,-122.33,4.0,'US',{port:1.0}); st('PDX','Portland',45.52,-122.68,2.5,'US'); st('JAX','Jacksonville',30.33,-81.66,1.6,'US');
st('ORL','Orlando',28.54,-81.38,2.7,'US'); st('MIA','Miami',25.77,-80.19,6.1,'US',{port:0.9});
st('TOR','Toronto',43.65,-79.38,6.4,'CA'); st('MTL','Montréal',45.5,-73.57,4.3,'CA',{port:0.8}); st('OTT','Ottawa',45.42,-75.7,1.5,'CA'); st('QUE','Québec',46.81,-71.21,0.8,'CA');
st('WPG','Winnipeg',49.9,-97.14,0.8,'CA'); st('SAS','Saskatoon',52.13,-106.67,0.3,'CA'); st('EDM','Edmonton',53.55,-113.49,1.4,'CA'); st('VAN','Vancouver',49.28,-123.12,2.6,'CA',{port:1.1});
st('MEX','Mexico',19.43,-99.13,22,'MX'); st('TOL','Toluca',19.29,-99.66,2.4,'MX'); st('QRO','Querétaro',20.59,-100.39,1.4,'MX'); st('GDL','Guadalajara',20.67,-103.35,5.3,'MX');
st('MTY','Monterrey',25.69,-100.32,5.3,'MX'); st('NLD','Nuevo Laredo',27.48,-99.51,0.4,'MX'); st('MID','Mérida',20.97,-89.62,1.3,'MX'); st('CUN','Cancún',21.16,-86.85,0.9,'MX');
/* ---------- Amérique du Sud ---------- */
st('BUE','Buenos Aires',-34.6,-58.38,15,'AR',{port:1.0}); st('ROS','Rosario',-32.95,-60.65,1.3,'AR'); st('CBA','Córdoba',-31.42,-64.18,1.6,'AR'); st('MZA','Mendoza',-32.89,-68.84,1.1,'AR');
st('SCL','Santiago du Chili',-33.45,-70.67,7,'CL'); st('CHN','Chillán',-36.61,-72.1,0.2,'CL');
st('SAO','São Paulo',-23.55,-46.63,22,'BR'); st('RIO','Rio de Janeiro',-22.91,-43.17,13,'BR',{port:1.0}); st('BHZ','Belo Horizonte',-19.92,-43.94,6,'BR',{mine:40,res:'fer'}); st('VIX','Vitória',-20.32,-40.34,2.0,'BR',{port:1.1});
st('LIM','Lima',-12.05,-77.04,10,'PE',{port:0.9}); st('HYO','Huancayo',-12.07,-75.21,0.5,'PE',{mine:5,res:'cuivre-zinc'}); st('CUZ','Cusco',-13.53,-71.97,0.45,'PE'); st('PUN','Puno',-15.84,-70.02,0.15,'PE'); st('AQP','Arequipa',-16.4,-71.54,1.1,'PE');
st('ORU','Oruro',-17.97,-67.11,0.3,'BO'); st('UYU','Uyuni',-20.46,-66.83,0.03,'BO',{mine:6,res:'lithium'});
/* ---------- Océanie ---------- */
st('SYD','Sydney',-33.87,151.21,5.3,'AU',{port:1.0}); st('CBR','Canberra',-35.28,149.13,0.45,'AU'); st('MEL','Melbourne',-37.81,144.96,5.1,'AU',{port:1.0}); st('ADL','Adélaïde',-34.93,138.6,1.4,'AU');
st('PAG','Port Augusta',-32.49,137.77,0.02,'AU'); st('KLG','Kalgoorlie',-30.75,121.47,0.03,'AU',{mine:15,res:'or-nickel'}); st('PER','Perth',-31.95,115.86,2.1,'AU',{port:1.0});
st('ASP','Alice Springs',-23.7,133.88,0.03,'AU'); st('DRW','Darwin',-12.46,130.84,0.15,'AU',{port:0.8}); st('BNE','Brisbane',-27.47,153.03,2.6,'AU');
st('AKL','Auckland',-36.85,174.76,1.7,'NZ'); st('WLG','Wellington',-41.29,174.78,0.4,'NZ');

/* ---------- voies ---------- */
// Afrique
tk(['DKR','THI'],80,'M',0,1,{op:'Dakar-Bamako'}); tk(['THI','TBA','KAY','BKO'],0,'M',0,1,{hs:1,op:'Dakar-Bamako'}); tk(['DKR','THI'],160,'S',1,2,{op:'TER Dakar'});
tk(['ABJ','BKE','OUA'],60,'M',0,1,{op:'Sitarail'}); tk(['ACC','KMS'],60,'C',0,1,{op:'GRC'});
tk(['LOS','IBA','ILR','MNA','KAD','KAN'],50,'C',0,1,{op:'NRC'});
tk(['ORN','ALG','CZL','ANB'],120,'S',0,2,{op:'SNTF'}); tk(['ANB','TUN'],70,'S',0,1,{op:'SNTF'}); tk(['TUN','SFA'],100,'S',0,1,{op:'SNCFT'});
tk(['PZU','ATB','KRT'],60,'C',0,1,{op:'SRC'});
tk(['JNB','MPM'],80,'C',0,1,{op:'CFM'}); tk(['HRE','BEW'],60,'C',0,1,{op:'CFM'}); tk(['MOZ','BLZ','NCA'],60,'C',0,1,{op:'CDN'});
tk(['WDH','WVB'],60,'C',0,1,{op:'TransNamib'}); tk(['WDH','KIM'],60,'C',0,1,{op:'TransNamib'});
// Europe : France
tk(['PAR','REI','MET','LUX'],300,'S',1,2,{op:'LGV'}); tk(['PAR','LMS','RNS'],320,'S',1,2,{op:'LGV'}); tk(['LMS','NTE'],220,'S',1,2,{op:'SNCF Réseau'});
tk(['PAR','TRS','PTS','BOD'],320,'S',1,2,{op:'LGV'}); tk(['BOD','BAY','BIO'],160,'S',1,2,{op:'SNCF Réseau'}); tk(['MRS','NCE','GOA','MIL'],150,'S',1,2,{op:'SNCF Réseau'});
tk(['LYS','GNB'],130,'S',1,2,{op:'SNCF Réseau'}); tk(['PAR','CFE'],160,'S',1,2,{op:'SNCF Réseau'}); tk(['LYS','CFE'],120,'S',1,1,{op:'SNCF Réseau'});
tk(['PAR','DIJ','BSL'],300,'S',1,2,{op:'LGV'}); tk(['PAR','ROU','LEH'],140,'S',1,2,{op:'SNCF Réseau'}); tk(['LYS','AVG','MRS'],300,'S',1,2,{op:'LGV'}); tk(['AVG','MTP'],300,'S',1,2,{op:'LGV'});
// Royaume-Uni
tk(['LON','BHM','MCR','LIV'],200,'S',1,2,{op:'Network Rail'}); tk(['MCR','GLA'],200,'S',1,2,{op:'Network Rail'}); tk(['LON','LDS','NCL','EDI','GLA'],200,'S',1,2,{op:'Network Rail'});
tk(['LON','BRS','CWL'],200,'S',1,2,{op:'Network Rail'}); tk(['LDS','MCR'],140,'S',1,2,{op:'Network Rail'});
// Benelux, Allemagne, Suisse, Autriche
tk(['AMS','RTM','ANR','BRU'],250,'S',1,2,{op:'ProRail'}); tk(['AMS','UTR','DUS'],160,'S',1,2,{op:'ProRail'}); tk(['BRU','LGG','CGN'],260,'S',1,2,{op:'Infrabel'}); tk(['LUX','BRU'],160,'S',1,2,{op:'CFL'});
tk(['CGN','DUS','DTM','HAJ','BER'],250,'S',1,2,{op:'DB'}); tk(['HAM','HAJ','FRA'],280,'S',1,2,{op:'DB'}); tk(['HAM','BER'],230,'S',1,2,{op:'DB'}); tk(['HAM','BRE'],160,'S',1,2,{op:'DB'});
tk(['FRA','MHG','STG','MUC'],280,'S',1,2,{op:'DB'}); tk(['FRA','NUE','MUC'],300,'S',1,2,{op:'DB'}); tk(['NUE','LEJ','BER'],300,'S',1,2,{op:'DB'}); tk(['LEJ','DRS'],200,'S',1,2,{op:'DB'});
tk(['MHG','BSL'],250,'S',1,2,{op:'DB'}); tk(['STR','BSL'],160,'S',1,2,{op:'SNCF Réseau'}); tk(['BSL','ZRH','BRN','LSN','GVA'],200,'S',1,2,{op:'CFF'}); tk(['ZRH','MIL'],200,'S',1,2,{op:'CFF'});
tk(['MUC','ZRH'],140,'S',1,1,{op:'DB'}); tk(['MUC','SZG','VIE'],230,'S',1,2,{op:'ÖBB'}); tk(['MUC','INN','VRN'],160,'S',1,2,{op:'ÖBB'}); tk(['VIE','GRZ','LJU','ZAG'],120,'S',1,2,{op:'ÖBB'});
// Italie, Ibérie
tk(['VRN','MIL'],300,'S',1,2,{op:'RFI'}); tk(['VRN','VCE','BOL'],250,'S',1,2,{op:'RFI'}); tk(['NAP','RCL'],160,'S',1,2,{op:'RFI'}); tk(['ROM','BRI'],160,'S',1,2,{op:'RFI'}); tk(['BOL','BRI'],180,'S',1,2,{op:'RFI'});
tk(['MAD','ODB','SVQ'],300,'S',1,2,{op:'Adif'}); tk(['ODB','AGP'],300,'S',1,2,{op:'Adif'}); tk(['MAD','VLC'],300,'S',1,2,{op:'Adif'}); tk(['VLC','BCN'],200,'S',1,2,{op:'Adif'});
tk(['MAD','ZAZ','BCN'],310,'S',1,2,{op:'Adif'}); tk(['MAD','BIO'],200,'S',1,2,{op:'Adif'}); tk(['LIS','OPO'],220,'B',1,2,{op:'IP'});
// Scandinavie, Europe centrale et orientale, Balkans, Turquie
tk(['HAM','CPH','MMA'],160,'S',1,2,{op:'DSB'}); tk(['MMA','GOT','OSL'],160,'S',1,2,{op:'Trafikverket'}); tk(['MMA','STO'],200,'S',1,2,{op:'Trafikverket'}); tk(['GOT','STO'],200,'S',1,2,{op:'Trafikverket'}); tk(['OSL','BGO'],100,'S',1,1,{op:'Bane NOR'});
tk(['BER','POZ','WAW'],160,'S',1,2,{op:'PKP'}); tk(['WAW','KRK'],200,'S',1,2,{op:'PKP'}); tk(['WAW','GDN'],200,'S',1,2,{op:'PKP'}); tk(['DRS','WRO','KRK'],140,'S',1,2,{op:'PKP'}); tk(['WRO','POZ'],160,'S',1,2,{op:'PKP'});
tk(['DRS','PRG','BRQ','VIE'],160,'S',1,2,{op:'SŽ'}); tk(['VIE','BTS','BUD'],160,'S',1,2,{op:'ÖBB'}); tk(['BUD','BEG'],200,'S',1,2,{op:'MÁV'}); tk(['BUD','BUH'],100,'S',1,1,{op:'CFR'}); tk(['BUH','SOF'],80,'S',0,1,{op:'BDŽ'});
tk(['ZAG','BEG','SOF','IST'],100,'S',1,1,{op:'Balkans'}); tk(['SOF','THS','ATH'],160,'S',1,2,{op:'OSE'}); tk(['IST','ANK','KNY'],250,'S',1,2,{op:'TCDD'});
// Russie (voie russe), avec changements d'écartement aux frontières
tk(['WAW','BST'],160,'S',1,2,{op:'PKP'}); tk(['BST','MSQ','MOW'],140,'R',1,2,{op:'RZD'}); tk(['HEL','LED'],200,'R',1,2,{op:'VR'}); tk(['LED','MOW'],250,'R',1,2,{op:'RZD'});
tk(['MOW','NNV','KZN','SVX','OMS','NSK','KJA','IKT','UUD','CHT','KHV','VVO'],100,'R',1,2,{op:'Transsibérien'});
tk(['CHT','ZBK'],80,'R',1,1,{op:'RZD'}); tk(['ZBK','MZL'],60,'S',0,1,{op:'Frontière'}); tk(['MZL','HRB'],140,'S',1,2,{op:'CR'});
tk(['UUD','ULN','ZMU'],70,'R',0,1,{op:'UBTZ'}); tk(['ZMU','ERL'],40,'S',0,1,{op:'Frontière'}); tk(['ERL','PEK'],160,'S',1,1,{op:'CR'});
// Chine, Corée, Japon, Asie du Sud-Est
tk(['PEK','TSN'],350,'S',1,2,{op:'CR'}); tk(['PEK','SHE','HRB'],300,'S',1,2,{op:'CR'}); tk(['PEK','ZZH','WUH'],350,'S',1,2,{op:'CR'}); tk(['ZZH','XIY','CTU','CKG'],300,'S',1,2,{op:'CR'});
tk(['CKG','KMG'],250,'S',1,2,{op:'CR'}); tk(['SHA','HGH'],350,'S',1,2,{op:'CR'}); tk(['HGH','CSX'],300,'S',1,2,{op:'CR'}); tk(['WUH','CSX','CAN'],310,'S',1,2,{op:'CR'}); tk(['KMG','VTE'],160,'S',1,1,{op:'LCR'});
tk(['VTE','BKK'],90,'M',0,1,{op:'SRT'}); tk(['BKK','KUL','SIN'],90,'M',1,1,{op:'KTM'}); tk(['HAN','SGN'],70,'M',0,1,{op:'VNR'});
tk(['SEL','DJN','DGU','PUS'],300,'S',1,2,{op:'KTX'});
tk(['TYO','SDJ'],320,'S',1,2,{op:'Shinkansen'}); tk(['TYO','NII'],240,'S',1,2,{op:'Shinkansen'}); tk(['TYO','NGN','KNZ'],260,'S',1,2,{op:'Shinkansen'}); tk(['FUK','KOJ'],260,'S',1,2,{op:'Shinkansen'});
// Inde (voie large)
tk(['DEL','AGR','BHO','NAG','HYD','BLR','MAA'],130,'B',1,2,{op:'Indian Railways'}); tk(['DEL','JAI','AMD','MUM'],130,'B',1,2,{op:'Indian Railways'}); tk(['MUM','PNQ','HYD'],110,'B',1,2,{op:'Indian Railways'});
tk(['DEL','LKO','VNS','PAT'],130,'B',1,2,{op:'Indian Railways'}); tk(['VNS','GAY','DHN','CCU'],130,'B',1,2,{op:'Indian Railways'}); tk(['PAT','CCU'],110,'B',1,2,{op:'Indian Railways'}); tk(['NAG','CCU'],110,'B',1,2,{op:'Indian Railways'}); tk(['MUM','NAG'],110,'B',1,2,{op:'Indian Railways'});
// Moyen-Orient
tk(['MED','JED','MEC'],300,'S',1,2,{op:'Haramain'}); tk(['RUH','DMM'],160,'S',0,2,{op:'SAR'});
// Amérique du Nord
tk(['NYC','ALB','BUF','CLE','CHI'],110,'S',0,2,{op:'Amtrak'}); tk(['WAS','PIT','CHI'],110,'S',0,2,{op:'Amtrak'}); tk(['WAS','RIC','CLT','ATL','NOL','HOU','SAT','ELP','TUS','LAX'],110,'S',0,1,{op:'Amtrak'});
tk(['LAX','SAN'],140,'S',0,2,{op:'Amtrak'}); tk(['LAX','SFO'],110,'S',0,1,{op:'Amtrak'}); tk(['CHI','KCI','DEN','SLC','RNO','SAC','SFO'],120,'S',0,1,{op:'Amtrak'}); tk(['CHI','STL','DAL','HOU'],120,'S',0,1,{op:'Amtrak'});
tk(['DAL','SAT'],110,'S',0,1,{op:'Amtrak'}); tk(['SAC','PDX','SEA'],120,'S',0,1,{op:'Amtrak'}); tk(['CHI','MSP','SPK','SEA'],120,'S',0,1,{op:'Amtrak'}); tk(['RIC','JAX','ORL'],120,'S',0,2,{op:'Amtrak'}); tk(['ORL','MIA'],200,'S',0,2,{op:'Brightline'});
tk(['TOR','MTL','QUE'],160,'S',0,2,{op:'VIA Rail'}); tk(['TOR','OTT','MTL'],140,'S',0,2,{op:'VIA Rail'}); tk(['TOR','WPG','SAS','EDM','VAN'],100,'S',0,1,{op:'VIA Rail'}); tk(['TOR','BUF'],110,'S',0,1,{op:'VIA Rail'}); tk(['MTL','ALB'],110,'S',0,1,{op:'Amtrak'});
tk(['SAT','NLD','MTY','QRO','MEX'],100,'S',0,1,{op:'CPKC'}); tk(['QRO','GDL'],100,'S',0,1,{op:'Ferromex'}); tk(['MEX','TOL'],160,'S',1,2,{op:'El Insurgente'}); tk(['MID','CUN'],160,'S',0,1,{op:'Tren Maya'});
// Amérique du Sud
tk(['BUE','ROS','CBA'],100,'B',0,1,{op:'Trenes Argentinos'}); tk(['BUE','MZA'],80,'B',0,1,{op:'Trenes Argentinos'}); tk(['SCL','CHN'],160,'B',1,2,{op:'EFE'});
tk(['SAO','RIO'],80,'B',0,2,{op:'MRS'}); tk(['BHZ','VIX'],70,'M',0,2,{op:'Vitória-Minas'}); tk(['RIO','BHZ'],60,'M',0,1,{op:'FCA'});
tk(['LIM','HYO'],40,'S',0,1,{op:'FCCA'}); tk(['CUZ','PUN','AQP'],50,'S',0,1,{op:'PeruRail'}); tk(['ORU','UYU'],60,'M',0,1,{op:'FCA Bolivie'});
// Océanie
tk(['BNE','SYD','MEL','ADL','PAG','KLG','PER'],120,'S',0,1,{op:'ARTC'}); tk(['SYD','CBR'],110,'S',0,1,{op:'NSW TrainLink'}); tk(['PAG','ASP','DRW'],110,'S',0,1,{op:'The Ghan'});
tk(['AKL','WLG'],90,'C',0,1,{op:'KiwiRail'});

/* ---------- matériel pour les nouveaux écartements et réseaux ---------- */
Object.assign(MODELS,{
  HIR1:{name:'Hirondelle S-150',g:'S',pax:180,t:10,vmax:120,acc:0.6,price:150000,fpk:3,lvl:1,liv:['#0f766e','#f8fafc','#334155']},
  GAN2:{name:'Ganga B-200',g:'B',pax:220,t:20,vmax:110,acc:0.5,price:110000,fpk:3,lvl:1,liv:['#1d4ed8','#f59e0b','#1e293b']},
  VOL2:{name:'Volga R-200',g:'R',pax:200,t:20,vmax:120,acc:0.5,price:140000,fpk:3,lvl:1,liv:['#b91c1c','#e5e7eb','#374151']},
  DEC1:{name:'Deccan Express 1000',g:'B',el:1,pax:1000,t:60,vmax:130,acc:0.4,price:600000,epk:20,lvl:3,liv:['#0369a1','#fde047','#1f2937']},
  BHA25:{name:'Bharat Fret 2500',g:'B',pax:0,t:2500,vmax:75,acc:0.15,price:950000,fpk:12,lvl:4,liv:['#7c2d12','#fbbf24','#1c1917']},
  TAI7:{name:'Taïga Express 700',g:'R',el:1,pax:700,t:40,vmax:160,acc:0.5,price:650000,epk:22,lvl:3,liv:['#1e3a8a','#dc2626','#e5e7eb']},
  SIB3:{name:'Sibérie Fret 3000',g:'R',el:1,pax:0,t:3000,vmax:90,acc:0.15,price:1200000,epk:35,lvl:5,liv:['#374151','#ef4444','#111827']},
  PRA4:{name:'Prairie Liner 400',g:'S',pax:400,t:30,vmax:140,acc:0.4,price:420000,fpk:6,lvl:2,liv:['#e5e7eb','#2563eb','#991b1b']},
  CAN30:{name:'Continental Fret 3000',g:'S',pax:0,t:3000,vmax:100,acc:0.15,price:900000,fpk:14,lvl:4,liv:['#ea580c','#111827','#1f2937']},
  PAM2:{name:'Pampa B-300',g:'B',pax:300,t:30,vmax:120,acc:0.5,price:200000,fpk:4,lvl:2,liv:['#0ea5e9','#ffffff','#334155']}
});
for(const k in MODELS){ const m=MODELS[k]; m.kind=m.pax?'pax':'frt'; }

/* hubs proposés au départ d'une partie */
const START_CITIES=['KIN','LUB','BZV','PNR','KWZ','MAT','KGA','KIS','LOS','DKR','ABJ','JNB','DAR','NBO','CAS','CAI','PAR','LON','BER','MAD','ROM','MOW','IST','DEL','MUM','PEK','SHA','TYO','SEL','BKK','NYC','CHI','LAX','TOR','MEX','SAO','BUE','SYD'];
/* régions pour la navigation rapide sur la carte : [nom, lat, lon, zoom] */
const MAP_REGIONS=[['Congo',-5,21,5],['Afrique',0,20,3],['Afrique australe',-22,28,5],['Afrique de l\'Ouest',10,-4,5],['Maghreb et Égypte',31,8,4],['Europe',49,9,4],
  ['Russie et Transsibérien',55,80,3],['Inde',22,79,5],['Chine',33,112,4],['Japon et Corée',36,134,5],['Asie du Sud-Est',12,104,4],['Moyen-Orient',24,44,5],
  ['Amérique du Nord',41,-96,3],['Mexique',22,-100,5],['Amérique du Sud',-22,-60,3],['Australie',-28,135,4],['Nouvelle-Zélande',-39,175,5]];
