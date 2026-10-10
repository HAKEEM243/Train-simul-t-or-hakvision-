/* =========================================================
   Hakvision Rail — manifeste des passagers et du fret
   Chaque voyageur d'un trajet est généré de façon déterministe (même trajet = mêmes passagers, même après rechargement) :
   nom selon sa nationalité, âge, métier, gare de montée et de descente (réelles, issues de la matrice origine-destination du trajet),
   comment il est venu à la gare, pourquoi il voyage, classe et prix du billet, bagages, fraude (verbalisé ou non), avis.
   Tout est fictif : aucune personne réelle.
   ========================================================= */
'use strict';
/* générateur pseudo-aléatoire reproductible */
function rngOf(seed){ let a=seed>>>0||1; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const pickR=(r,a)=>a[Math.floor(r()*a.length)];
function pickW(r,obj){ let tot=0; for(const k in obj) tot+=obj[k]; let x=r()*tot; for(const k in obj){ x-=obj[k]; if(x<=0) return k; } return Object.keys(obj)[0]; }

/* ---------- nationalités : drapeau, nom, prénoms (h / f), noms de famille ---------- */
const NAT={
  CD:{f:'🇨🇩',n:'Congolaise (RDC)',m:['Jean-Pierre','Patrick','Dieudonné','Joseph','Glody','Fiston','Exaucé','Papy','Héritier','Junior','Christian','Jonathan','Trésor','Emmanuel','Blaise','Serge','Fabrice','Didier','Prince','Josué'],
      w:['Mamie','Grâce','Christelle','Merveille','Esther','Bénédicte','Chancelvie','Rachel','Nathalie','Sarah','Gloire','Ruth','Divine','Plamedie','Dorcas','Jolie','Marlène','Gracia','Prisca','Naomie'],
      l:['Mbuyi','Kalala','Tshibangu','Ilunga','Mukendi','Kabamba','Lukusa','Nzuzi','Makiese','Mavungu','Mbala','Kanku','Mulumba','Nkulu','Kasongo','Lumbala','Ngoy','Kayembe','Masudi','Lokwa','Matondo','Nsimba','Diakiese','Bompeti','Tshimanga','Mwamba','Kabongo','Mutombo','Kitenge','Lusamba','Bokungu','Mampuya','Ndombe','Kiala','Luzolo']},
  CG:{f:'🇨🇬',n:'Congolaise (Brazzaville)',m:['Arsène','Rodrigue','Brice','Guy-Roger','Prisca','Ghislain','Armel','Juvénal','Destin','Landry'],w:['Clarisse','Gladys','Nadège','Larissa','Bénie','Ornella','Sylvie','Fortunée'],
      l:['Mabiala','Moukala','Bouanga','Loubaki','Massamba','Nkounkou','Mavoungou','Okemba','Bassoumba','Malonga','Ngoma','Samba','Itoua','Ondongo']},
  AO:{f:'🇦🇴',n:'Angolaise',m:['João','António','Manuel','Domingos','Afonso','Paulo','Mateus'],w:['Teresa','Isabel','Luísa','Joana','Esperança','Madalena'],l:['Silva','dos Santos','Fernandes','Neto','Cardoso','Domingos','Kiala','Mendes','Sebastião','Tavares']},
  ZM:{f:'🇿🇲',n:'Zambienne',m:['Chola','Bwalya','Mwila','Mulenga','Kabwe','Joseph'],w:['Mutinta','Chipo','Natasha','Mwape','Grace','Chilufya'],l:['Banda','Phiri','Mwale','Tembo','Zulu','Chanda','Mulenga','Lungu','Sakala']},
  TZ:{f:'🇹🇿',n:'Tanzanienne',m:['Juma','Hassan','Baraka','Emmanuel','Rashidi','Said'],w:['Neema','Zawadi','Rehema','Amina','Upendo','Halima'],l:['Mwakyusa','Massawe','Mushi','Kimaro','Mwinyi','Shirima','Lyimo']},
  KE:{f:'🇰🇪',n:'Kényane',m:['Brian','Kevin','Otieno','Kamau','Kiprono','Dennis'],w:['Wanjiru','Akinyi','Faith','Mercy','Chebet','Njeri'],l:['Mwangi','Otieno','Kiprotich','Kamau','Odhiambo','Wanjala','Mutua']},
  UG:{f:'🇺🇬',n:'Ougandaise',m:['Moses','Isaac','Ronald'],w:['Sarah','Esther','Patience'],l:['Okello','Mugisha','Ssempala','Namutebi']},
  RW:{f:'🇷🇼',n:'Rwandaise',m:['Eric','Jean-Claude','Olivier'],w:['Claudine','Aline','Diane'],l:['Uwimana','Habimana','Niyonzima','Mukamana']},
  BI:{f:'🇧🇮',n:'Burundaise',m:['Pacifique','Désiré'],w:['Odette','Clémence'],l:['Ndayishimiye','Niyonkuru','Hakizimana']},
  ZA:{f:'🇿🇦',n:'Sud-Africaine',m:['Thabo','Sipho','Johan','Pieter','Lwazi'],w:['Thandeka','Naledi','Annelie','Zanele','Lerato'],l:['Nkosi','Dlamini','van der Merwe','Botha','Khumalo','Mokoena','Naidoo']},
  ZW:{f:'🇿🇼',n:'Zimbabwéenne',m:['Tendai','Tatenda','Farai'],w:['Rutendo','Nyasha','Chipo'],l:['Moyo','Ncube','Sibanda','Chikwanha']},
  NG:{f:'🇳🇬',n:'Nigériane',m:['Chinedu','Emeka','Tunde','Ibrahim','Segun'],w:['Ngozi','Funmilayo','Aisha','Chioma','Yetunde'],l:['Okafor','Adeyemi','Bello','Okonkwo','Adebayo','Eze']},
  CM:{f:'🇨🇲',n:'Camerounaise',m:['Samuel','Hervé','Achille'],w:['Pélagie','Linda','Odile'],l:['Mbarga','Fotso','Nkoulou','Tchoua','Ateba']},
  GA:{f:'🇬🇦',n:'Gabonaise',m:['Ulrich','Yannick'],w:['Murielle','Annick'],l:['Nguema','Mba','Obiang','Moussavou']},
  SN:{f:'🇸🇳',n:'Sénégalaise',m:['Mamadou','Ousmane','Cheikh'],w:['Aminata','Fatou','Awa'],l:['Diop','Ndiaye','Fall','Sow','Faye']},
  CI:{f:'🇨🇮',n:'Ivoirienne',m:['Koffi','Yao','Kouassi'],w:['Adjoua','Affoué','Aya'],l:['Kouamé','Konan','Traoré','Yao','Bamba']},
  MA:{f:'🇲🇦',n:'Marocaine',m:['Youssef','Mehdi','Karim'],w:['Salma','Fatima-Zahra','Imane'],l:['El Amrani','Benali','Alaoui','Bennani','Idrissi']},
  EG:{f:'🇪🇬',n:'Égyptienne',m:['Ahmed','Mohamed','Omar'],w:['Mariam','Nour','Yasmine'],l:['Hassan','Mahmoud','Fathy','Abdelrahman']},
  ET:{f:'🇪🇹',n:'Éthiopienne',m:['Abebe','Dawit','Yonas'],w:['Hiwot','Selam','Meron'],l:['Tadesse','Bekele','Girma','Haile']},
  FR:{f:'🇫🇷',n:'Française',m:['Lucas','Hugo','Thomas','Julien','Nicolas','Antoine','Mathieu'],w:['Camille','Léa','Manon','Chloé','Julie','Sophie','Inès'],l:['Martin','Bernard','Dubois','Moreau','Laurent','Lefèvre','Garnier','Roux','Fontaine']},
  BE:{f:'🇧🇪',n:'Belge',m:['Arnaud','Pieter','Benoît','Wout'],w:['Charlotte','Elke','Anaïs','Lien'],l:['Peeters','Janssens','Maes','Lambert','Dupont','Claes','Willems']},
  GB:{f:'🇬🇧',n:'Britannique',m:['Oliver','Harry','James','George'],w:['Emily','Olivia','Charlotte','Amelia'],l:['Smith','Jones','Taylor','Brown','Evans','Wilson']},
  DE:{f:'🇩🇪',n:'Allemande',m:['Lukas','Jonas','Felix','Maximilian'],w:['Anna','Lena','Laura','Hannah'],l:['Müller','Schmidt','Schneider','Fischer','Weber','Wagner']},
  NL:{f:'🇳🇱',n:'Néerlandaise',m:['Daan','Sem','Bram'],w:['Emma','Sanne','Fleur'],l:['de Jong','Jansen','de Vries','Bakker','Visser']},
  CH:{f:'🇨🇭',n:'Suisse',m:['Luca','Noah'],w:['Mia','Lara'],l:['Meier','Keller','Favre','Huber']},
  IT:{f:'🇮🇹',n:'Italienne',m:['Marco','Luca','Giovanni','Alessandro'],w:['Giulia','Francesca','Chiara','Sara'],l:['Rossi','Russo','Ferrari','Esposito','Bianchi','Romano']},
  ES:{f:'🇪🇸',n:'Espagnole',m:['Javier','Pablo','Diego','Sergio'],w:['Lucía','María','Carmen','Paula'],l:['García','Fernández','López','Martínez','Sánchez','Pérez']},
  PT:{f:'🇵🇹',n:'Portugaise',m:['Tiago','Rui','Miguel'],w:['Inês','Beatriz','Rita'],l:['Silva','Santos','Ferreira','Pereira','Costa']},
  PL:{f:'🇵🇱',n:'Polonaise',m:['Jakub','Piotr','Kamil'],w:['Zuzanna','Agnieszka','Kasia'],l:['Nowak','Kowalski','Wiśniewski','Wójcik']},
  RU:{f:'🇷🇺',n:'Russe',m:['Dmitri','Alexeï','Sergueï','Ivan','Nikolaï'],w:['Anastasia','Olga','Tatiana','Ekaterina','Natalia'],l:['Ivanov','Smirnov','Kouznetsov','Popov','Volkov','Sokolov']},
  CN:{f:'🇨🇳',n:'Chinoise',m:['Wei','Hao','Jun','Lei','Ming'],w:['Li Na','Xiu Ying','Mei','Fang','Jing'],l:['Wang','Li','Zhang','Liu','Chen','Yang','Huang','Zhao']},
  JP:{f:'🇯🇵',n:'Japonaise',m:['Haruto','Ren','Takumi','Kenji'],w:['Yui','Sakura','Aoi','Haruka'],l:['Satō','Suzuki','Takahashi','Tanaka','Watanabe','Itō']},
  KR:{f:'🇰🇷',n:'Coréenne',m:['Min-jun','Ji-ho','Seo-jun'],w:['Seo-yeon','Ji-woo','Ha-eun'],l:['Kim','Lee','Park','Choi','Jung']},
  IN:{f:'🇮🇳',n:'Indienne',m:['Rahul','Arjun','Amit','Vikram','Sanjay','Rohan'],w:['Priya','Ananya','Pooja','Kavya','Sunita','Meera'],l:['Sharma','Patel','Singh','Kumar','Gupta','Reddy','Iyer','Das']},
  LB:{f:'🇱🇧',n:'Libanaise',m:['Karim','Elie','Georges'],w:['Rania','Nadine','Maya'],l:['Haddad','Khoury','Nassar','Saad']},
  US:{f:'🇺🇸',n:'Américaine',m:['Michael','James','Tyler','Jacob'],w:['Ashley','Jessica','Emily','Madison'],l:['Smith','Johnson','Williams','Brown','Jones','Miller','Davis']},
  CA:{f:'🇨🇦',n:'Canadienne',m:['Liam','Félix','Noah'],w:['Olivia','Florence','Emma'],l:['Tremblay','Gagnon','Roy','Smith','Côté']},
  MX:{f:'🇲🇽',n:'Mexicaine',m:['José','Luis','Juan'],w:['Guadalupe','María','Fernanda'],l:['Hernández','García','Martínez','López']},
  BR:{f:'🇧🇷',n:'Brésilienne',m:['Gabriel','Lucas','Rafael'],w:['Ana','Juliana','Beatriz'],l:['Silva','Santos','Oliveira','Souza','Lima']},
  AR:{f:'🇦🇷',n:'Argentine',m:['Mateo','Santiago','Facundo'],w:['Sofía','Valentina','Camila'],l:['González','Rodríguez','Gómez','Fernández']},
  AU:{f:'🇦🇺',n:'Australienne',m:['Jack','William','Cooper'],w:['Charlotte','Isla','Ruby'],l:['Smith','Jones','Williams','Kelly','Taylor']},
  TR:{f:'🇹🇷',n:'Turque',m:['Mehmet','Emre','Burak'],w:['Elif','Zeynep','Ayşe'],l:['Yılmaz','Kaya','Demir','Şahin','Çelik']},
  SA:{f:'🇸🇦',n:'Saoudienne',m:['Abdullah','Faisal','Khalid'],w:['Noura','Reem','Sara'],l:['Al-Harbi','Al-Qahtani','Al-Ghamdi','Al-Otaibi']},
  TH:{f:'🇹🇭',n:'Thaïlandaise',m:['Somchai','Anan'],w:['Malee','Siriporn'],l:['Saelim','Chaiyaporn','Srisuk']},
  VN:{f:'🇻🇳',n:'Vietnamienne',m:['Minh','Huy'],w:['Linh','Thảo'],l:['Nguyễn','Trần','Lê','Phạm']},
  GR:{f:'🇬🇷',n:'Grecque',m:['Giorgos','Nikos'],w:['Eleni','Maria'],l:['Papadopoulos','Georgiou','Nikolaidis']}
};
/* d'où viennent les voyageurs : pays de la ligne → nationalités et poids (le reste : expatriés et visiteurs) */
const NAT_MIX={
  CD:{CD:82,CG:3,AO:2,ZM:1,RW:1,BI:1,BE:2,FR:2,CN:2,LB:1,IN:1,ZA:0.5,US:0.5,TZ:0.5,KE:0.3,NG:0.4,CM:0.3},
  CG:{CG:80,CD:8,FR:4,CM:2,GA:2,CN:2,LB:1,SN:1},
  AO:{AO:85,CD:5,PT:4,BR:2,CN:3,ZA:1},ZM:{ZM:84,CD:6,ZW:3,ZA:2,CN:3,IN:2},ZW:{ZW:85,ZA:6,ZM:5,GB:2,CN:2},
  ZA:{ZA:85,ZW:5,MZ:0,GB:3,DE:2,NG:2,CD:2,IN:1},TZ:{TZ:85,KE:4,CD:3,RW:2,BI:2,IN:2,CN:2},KE:{KE:86,UG:4,TZ:3,IN:2,GB:2,US:1,CN:2},
  UG:{UG:85,KE:5,RW:4,CD:4,IN:2},GA:{GA:78,CM:6,CG:5,FR:7,CN:2,SN:2},CM:{CM:88,NG:3,FR:4,CN:2,GA:1,CG:2},
  NG:{NG:92,GB:2,CN:2,LB:2,IN:2},ET:{ET:90,CN:6,KE:2,US:2},DJ:{ET:40,FR:10,CN:10,SA:10,US:5},MA:{MA:85,FR:7,ES:4,SN:2,CI:2},EG:{EG:90,SA:3,GB:2,DE:2,IT:1,FR:2},
  SN:{SN:85,FR:5,CI:3,MA:2,LB:2},CI:{CI:84,FR:5,SN:3,LB:3,MA:2},
  FR:{FR:80,BE:3,DE:2,GB:2,IT:2,ES:2,MA:2,US:2,CN:2,CD:1,SN:1,CI:1},BE:{BE:72,FR:8,NL:6,CD:5,DE:3,MA:3,IT:2},GB:{GB:80,IN:5,FR:3,US:3,PL:3,DE:2,NG:2,IT:2},
  DE:{DE:82,TR:5,PL:3,IT:2,FR:2,US:2,RU:2,CN:2},NL:{NL:80,DE:5,BE:4,GB:3,TR:3,MA:3},CH:{CH:70,DE:10,FR:10,IT:8,PT:2},IT:{IT:86,DE:3,FR:3,US:3,CN:2,RO:0,MA:2},
  ES:{ES:84,FR:4,GB:4,MA:3,DE:2,AR:2},PT:{PT:82,BR:8,AO:3,FR:3,ES:2,GB:2},PL:{PL:90,DE:4,RU:2,GB:2},RU:{RU:92,CN:3,DE:1,US:1,IN:1},
  CN:{CN:97,US:1,JP:1,KR:1},JP:{JP:94,CN:2,KR:2,US:2},KR:{KR:94,CN:3,JP:2,US:1},IN:{IN:98,GB:1,US:1},US:{US:88,MX:4,CA:2,CN:2,IN:2,GB:2},
  CA:{CA:88,US:5,FR:2,IN:2,CN:2},MX:{MX:92,US:5,ES:1},BR:{BR:94,AR:2,PT:2,US:1},AR:{AR:92,BR:3,ES:2,IT:2},AU:{AU:85,GB:4,CN:4,IN:3,US:2},
  TR:{TR:92,DE:3,RU:2,GB:1},SA:{SA:70,IN:10,EG:8,TR:4,US:2},TH:{TH:90,CN:4,JP:2,US:2},VN:{VN:92,CN:4,KR:2},GR:{GR:88,DE:4,GB:3,IT:3}
};
const natMix=c=>NAT_MIX[c]||Object.assign({[c]:85},{FR:3,US:3,CN:3,GB:2,DE:2});
const natOf=k=>NAT[k]||{f:'🌍',n:(COUNTRIES[k]?COUNTRIES[k][0]:'Étrangère'),m:['Alex','Sam'],w:['Maria','Ana'],l:['Martin','Lee']};

/* ---------- régions de vie : métiers, motifs, moyens d'arrivée, bagages, avis ---------- */
const AFRC=['CD','CG','AO','ZM','ZW','TZ','KE','UG','RW','BI','GA','CM','NG','ET','DJ','SN','CI','ML','BF','GH','SD','MZ','MW','NA','BW'];
const isCongo=c=>['CD','CG'].includes(STATIONS[c].c);
const LIFE={
  congo:{
    jobs:['commerçante au marché','vendeuse de chikwangue','chauffeur de taxi-bus','enseignant','infirmière','étudiant à l\'UNIKIN','étudiante à l\'UPN','fonctionnaire','pasteur','creuseur artisanal','mécanicien','agent de la SNCC','agriculteur','cambiste','couturière','policier','militaire','électricien','maçon','journaliste','médecin','avocat','ingénieur des mines','retraité','élève','sans emploi','tailleur','boulanger','pêcheur','chauffeur de taxi-moto'],
    why:{'Commerce : vendre ses marchandises au marché':18,'Rendre visite à la famille':16,'Deuil (matanga) d\'un proche':6,'Mariage / remise de dot':5,'Études':7,'Rentrer au village':8,'Soins à l\'hôpital':5,'Travail':12,'Réunion de l\'église / évangélisation':5,'Acheter de la marchandise en gros':6,'Démarches administratives':3,'Match de football':2,'Chercher du travail':4},
    how:{'À pied':22,'Taxi-moto (wewa)':20,'Taxi-bus (fula-fula)':18,'Taxi « ketch »':8,'Minibus « esprit de mort »':7,'Pousse-pousse (avec ses marchandises)':5,'Voiture d\'un proche':6,'Camion de marchandises':4,'Vélo':3,'Pirogue puis à pied':3,'Train de correspondance':4},
    bags:['2 sacs de chikwangue','un régime de bananes plantain','un sac de makala (charbon de bois)','un poulet vivant','une valise','un sac à dos','des pagnes à vendre','un bidon d\'huile de palme','un sac de manioc (fufu)','du poisson salé (makayabu)','une malle en fer','un matelas roulé','un carton de savons','rien','une radio et un sac','des chèvres (au fourgon)','des cahiers et des livres','un sac de riz de 25 kg'],
    good:['Le train est arrivé, Dieu merci !','Bon voyage, merci au contrôleur.','Plus rapide que la route, c\'est sûr.','On a bien chanté pendant le trajet.','J\'ai pu vendre mes marchandises à bord.'],
    bad:['Il faisait très chaud dans la voiture.','Trop de monde, on était serrés.','Le train a beaucoup secoué sur la voie.','Les toilettes ne marchaient pas.','On a attendu longtemps en gare.']},
  afrique:{
    jobs:['commerçant','enseignante','infirmier','étudiant','fonctionnaire','agriculteur','mineur','chauffeur','ingénieur','comptable','vendeuse','mécanicien','retraité','élève','médecin','pasteur','journaliste','technicien'],
    why:{'Commerce':16,'Visite familiale':18,'Travail':16,'Études':8,'Retour au village':8,'Funérailles':5,'Mariage':4,'Santé':5,'Tourisme':4,'Démarches administratives':4},
    how:{'À pied':20,'Minibus':24,'Moto-taxi':16,'Taxi':8,'Voiture d\'un proche':10,'Vélo':4,'Bus':10,'Train de correspondance':4},
    bags:['un sac de maïs','une valise','un sac à dos','des tissus à vendre','un panier de fruits','rien','un carton','un bidon','une poule vivante'],
    good:['Voyage agréable.','Plus sûr que la route.','Bon service à bord.'],bad:['Train bondé.','Retard au départ.','Climatisation en panne.']},
  monde:{
    jobs:['ingénieure','développeur','étudiante','enseignant','infirmière','commercial','consultante','architecte','retraité','cheffe de projet','artiste','médecin','avocate','chercheur','ouvrier','vendeuse','photographe','journaliste','pilote de ligne','agricultrice','lycéen'],
    why:{'Trajet domicile-travail':18,'Rendez-vous professionnel':14,'Tourisme':14,'Visite familiale':14,'Week-end entre amis':8,'Études':8,'Salon professionnel':4,'Concert / festival':4,'Rendez-vous médical':4,'Mariage':2,'Retour de vacances':6},
    how:{'Métro':16,'Bus':14,'À pied':14,'Voiture':12,'Taxi / VTC':10,'Vélo':8,'Trottinette':4,'Tramway':8,'Train régional (correspondance)':10,'Covoiturage':4},
    bags:['une valise cabine','un sac à dos','un ordinateur portable','un vélo pliant','une grosse valise','rien','un sac de sport','une poussette','une guitare','un carton de livres'],
    good:['Rapide et ponctuel.','Très confortable.','Le wifi marchait bien.','Personnel aimable.','Super vue sur le paysage.'],bad:['Train en retard.','Pas de place assise.','Trop cher.','Bruyant.','Pas de prise électrique.']}
};
const lifeOf=c=>isCongo(c)?LIFE.congo:AFRC.includes(STATIONS[c].c)?LIFE.afrique:LIFE.monde;

/* accord du métier avec le genre */
const FEM={enseignant:'enseignante',ingénieur:'ingénieure',étudiant:'étudiante',agriculteur:'agricultrice',mécanicien:'mécanicienne',électricien:'électricienne',policier:'policière',boulanger:'boulangère',
  pêcheur:'pêcheuse',commerçant:'commerçante',chauffeur:'chauffeuse',avocat:'avocate',retraité:'retraitée',tailleur:'tailleuse',mineur:'mineuse',technicien:'technicienne',développeur:'développeuse',
  chercheur:'chercheuse',ouvrier:'ouvrière',lycéen:'lycéenne',infirmier:'infirmière',vendeur:'vendeuse',couturier:'couturière',chef:'cheffe',consultant:'consultante',architecte:'architecte',
  creuseur:'creuseuse',apprenti:'apprentie',militaire:'militaire',journaliste:'journaliste',cambiste:'cambiste',maçon:'maçonne',artiste:'artiste',photographe:'photographe',pasteur:'pasteure',agent:'agente',commercial:'commerciale','sans emploi':'sans emploi'};
const MAS=Object.fromEntries(Object.entries(FEM).map(([a,b])=>[b,a]));
function genderJob(job,woman){ const w=job.split(' '); const d=woman?FEM:MAS; if(d[w[0]]) w[0]=d[w[0]]; return w.join(' '); }
const YOUNG_WHY={'Aller à l\'école':40,'Voyage avec ses parents':30,'Rendre visite à la famille':20,'Match de football':10};

/* ---------- génération du manifeste d'un trajet ---------- */
function odOfTrip(x){ if(x.od) return x.od; const out=[], onb=[];          // anciens trajets : répartition à partir des montées/descentes
  x.stops.forEach((s,j)=>{ let off=s.off; while(off>0&&onb.length){ const g=onb[0], k=Math.min(off,g.n); out.push([g.i,j,k]); g.n-=k; off-=k; if(!g.n) onb.shift(); } if(s.on) onb.push({i:j,n:s.on}); }); return out; }
const MANIFEST_CACHE=new Map();
function manifestOf(tr,x){ x=x||tr.trip||tr.last; if(!x||!x.stops) return null; const key=(x.seed||x.dep||0)+'|'+tr.id; if(MANIFEST_CACHE.has(key)) return MANIFEST_CACHE.get(key);
  const m=MODELS[x.model||tr.model], r=rngOf(x.seed||Math.floor((x.dep||1)/1000)+tr.id), st=x.stops, od=odOfTrip(x), pax=[];
  const rt=x.route?routeById(x.route):routeOfTrain(tr), dep=x.dep||tr.dep, legT=st[st.length-1].arr||1, dur=x.dep===tr.dep?tr.dur:null;
  let seat=1; const coach=()=>{ const c=Math.floor((seat-1)/64)+1; const s=(seat-1)%64+1; seat++; return c+'-'+String(s).padStart(2,'0'); };
  for(const [i,j,n] of od){ const from=st[i].c, to=st[j].c, km=st[j].km!=null&&st[i].km!=null?Math.max(1,st[j].km-st[i].km):Math.round(gcKm(from,to)*1.18), life=lifeOf(from), mix=natMix(STATIONS[from].c);
    for(let k=0;k<n;k++){ const nk=pickW(r,mix), N=natOf(nk), woman=r()<0.48, age=Math.max(1,Math.round(r()<0.12?3+r()*14:18+Math.pow(r(),1.4)*62));
      const first=pickR(r,woman?N.w:N.m), last=pickR(r,N.l), cls=m.comfort&&r()<0.5?'Couchette':r()<(isCongo(from)?0.1:0.2)?'1re classe':'2e classe';
      const job=genderJob(age<6?'enfant':age<18?(r()<0.8?'élève':'apprenti'):age>66&&r()<0.7?'retraité':pickR(r,life.jobs),woman);
      const why=age<12?'Voyage avec ses parents':age<18?pickW(r,YOUNG_WHY):pickW(r,life.why), how=age<12?'Avec ses parents':pickW(r,life.how), bag=age<12?'un petit sac':pickR(r,life.bags);
      const price=Math.round(fareOf(from,km)*(cls==='1re classe'?1.8:cls==='Couchette'?(m.comfort||1.4):1)*(age<6?0:age<12?0.5:1)*100)/100;
      pax.push({id:pax.length+1,first,last,nat:nk,flag:N.f,natn:N.n,woman,age,job,from,to,i,j,km:Math.round(km),how,why,bag,cls,price,seat:coach(),fraud:0,caught:false,mood:0}); } }
  // fraudeurs et verbalisés (nombres exacts du trajet), plutôt des adultes jeunes en 2e classe
  const cand=pax.filter(p=>p.age>=14&&p.cls==='2e classe').sort(()=>r()-0.5), fr=Math.min(x.fraud||0,cand.length), ca=Math.min(x.caught||0,fr), fine=fineOf(st[0].c);
  cand.slice(0,fr).forEach((p,k)=>{ p.fraud=1; p.paid=0; p.caught=k<ca; if(p.caught){ const at=st[p.i+Math.floor(r()*Math.max(1,p.j-p.i))]; p.ctrlAt=at?at.c:p.from; p.fine=fine; p.fineNote=r()<0.85?'Amende payée sur place':'Amende payée après discussion avec le chef de train'; }
    p.excuse=pickR(r,['« J\'ai oublié mon porte-monnaie »','« Le guichet était fermé »','« Je descends juste à la prochaine »','« Mon frère a mon billet dans l\'autre voiture »','« Je n\'avais pas assez d\'argent »','Caché dans les toilettes','Monté par la mauvaise porte','« Je connais le conducteur »']); });
  for(const p of pax){ if(!p.fraud) p.paid=p.price;
    const crowd=st[p.i].ob/Math.max(1,m.pax||1), wear=(tr.wear||0)/100, s=4.4-1.6*Math.max(0,crowd-0.85)-1.2*wear-(p.fraud&&p.caught?1.5:0)+(p.cls!=='2e classe'?0.4:0)+(r()-0.5)*1.4;
    p.mood=Math.max(1,Math.min(5,Math.round(s))); p.comment=p.fraud&&p.caught?'« Ce n\'était pas mon jour… »':p.mood>=4?pickR(r,lifeOf(p.from).good):p.mood<=2?pickR(r,lifeOf(p.from).bad):'Trajet correct.';
    p.arr=st[p.j].arr; p.dep=st[p.i].dep; }
  const res={pax,st,dep,legT,dur,route:rt,x}; MANIFEST_CACHE.set(key,res); if(MANIFEST_CACHE.size>12) MANIFEST_CACHE.delete(MANIFEST_CACHE.keys().next().value); return res; }

/* ---------- manifeste du fret ---------- */
const CARGO_TYPES={'cuivre-cobalt':['Cathodes de cuivre','Hydroxyde de cobalt','Concentré de cuivre'],cuivre:['Cathodes de cuivre','Concentré de cuivre'],'cuivre-zinc':['Concentré de zinc','Cathodes de cuivre'],ciment:['Ciment en sacs','Clinker'],
  manganèse:['Minerai de manganèse'],charbon:['Charbon'],or:['Équipements miniers'],diamants:['Équipements miniers'],fer:['Minerai de fer'],phosphate:['Phosphate'],lithium:['Carbonate de lithium'],sucre:['Sucre en sacs'],'or-nickel':['Concentré de nickel'],métaux:['Acier laminé'],'cuivre-charbon':['Charbon','Concentré de cuivre'],cobalt:['Hydroxyde de cobalt']};
const IMPORTS=['Conteneurs de marchandises diverses','Carburant (citernes)','Farine de blé','Riz en sacs','Matériaux de construction','Véhicules neufs','Huile alimentaire','Engrais','Pièces détachées','Sucre et produits alimentaires'];
const SHIPPERS=['Kivu Trading SARL','Grands Lacs Logistique','Katanga Minerals (fictive)','Bas-Fleuve Import','Congo Cargo Express','Atlantique Fret','Lualaba Mining Services','Kin Distribution','Équateur Négoce','Trans-Afrique Logistics'];
function cargoOf(tr,x){ x=x||tr.trip||tr.last; if(!x||!x.stops) return null; const r=rngOf((x.seed||1)+17), a=x.stops[0].c, b=x.stops[x.stops.length-1].c, A=STATIONS[a], lots=[]; let left=x.tons||0, n=1;
  const kinds=A.mine?CARGO_TYPES[A.res]||['Minerai']:IMPORTS;
  while(left>0&&n<60){ const t=Math.min(left,Math.round((A.mine?60:25)+r()*(A.mine?40:30))); lots.push({n:n++,wagon:'W'+String(n*3+Math.floor(r()*3)).padStart(3,'0'),what:pickR(r,kinds),t,client:pickR(r,SHIPPERS),from:a,to:b}); left-=t; } return lots; }

/* ---------- fenêtre « Passagers » ---------- */
const PAXUI={id:null,which:'trip',f:'all',st:'',q:'',n:40,open:null};
function paxStatus(tr,M,p){ if(M.x!==tr.trip||tr.state!=='enroute') return 'Arrivé à '+stationName(p.to);
  const x=tripProgress(tr); if(!x) return ''; if(p.i>x.last||(p.i===x.last&&!x.atStop&&x.last===0&&false)) return 'Attend en gare de '+stationName(p.from);
  if(p.j<=x.last) return 'Descendu à '+stationName(p.to); return 'À bord · descend à '+stationName(p.to); }
function topList(arr,key,n){ const c={}; for(const p of arr){ const k=typeof key==='function'?key(p):p[key]; c[k]=(c[k]||0)+1; } return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,n||6); }
function barList(title,rows,total,fmt){ return `<div class="pstat"><h5>${title}</h5>${rows.map(([k,v])=>`<div class="pb"><span>${fmt?fmt(k):esc(k)}</span><i style="width:${Math.max(3,v/total*100)}%"></i><b>${Math.round(v/total*100)} %</b></div>`).join('')}</div>`; }
const AV=['#e0457b','#4f9fe0','#22c4b0','#f6c445','#f7941d','#9b2fae','#2fb36a','#e05252'];
function mPax(arg){ const tr=trainById(PAXUI.id); if(!tr) return sheet('PASSAGERS','<div class="empty">Train introuvable.</div>');
  const x=PAXUI.which==='last'?tr.last:tr.trip, M=x&&manifestOf(tr,x); if(!M) return sheet('PASSAGERS','<div class="empty">Pas de passagers pour ce trajet.</div>');
  const all=M.pax, r=M.route, live=x===tr.trip&&tr.state==='enroute', prog=live?tripProgress(tr):null;
  let L=all; const q=PAXUI.q.trim().toLowerCase();
  if(PAXUI.f==='fraud') L=L.filter(p=>p.fraud); if(PAXUI.f==='caught') L=L.filter(p=>p.caught); if(PAXUI.f==='free') L=L.filter(p=>p.fraud&&!p.caught);
  if(PAXUI.f==='onboard'&&prog) L=L.filter(p=>p.i<=prog.last&&p.j>prog.last); if(PAXUI.f==='happy') L=L.filter(p=>p.mood>=4); if(PAXUI.f==='sad') L=L.filter(p=>p.mood<=2);
  if(PAXUI.st) L=L.filter(p=>p.from===PAXUI.st||p.to===PAXUI.st);
  if(q) L=L.filter(p=>(p.first+' '+p.last+' '+p.natn+' '+p.job+' '+stationName(p.from)+' '+stationName(p.to)).toLowerCase().includes(q));
  const fr=all.filter(p=>p.fraud), ca=fr.filter(p=>p.caught), avg=all.reduce((s,p)=>s+p.mood,0)/Math.max(1,all.length), age=all.reduce((s,p)=>s+p.age,0)/Math.max(1,all.length);
  const onb=prog?all.filter(p=>p.i<=prog.last&&p.j>prog.last).length:0, stars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
  const head=`<div class="prev"><b>${esc(r?r.name:tr.name)}</b> · ${esc(stationName(M.st[0].c))} → ${esc(stationName(M.st[M.st.length-1].c))} · départ ${new Date(M.dep).toLocaleString('fr',{weekday:'short',hour:'2-digit',minute:'2-digit'})}${live?` · <b>${onb}</b> à bord maintenant`:' · trajet terminé'}</div>
   <div class="kpi k4"><div><span>Voyageurs</span><b>${all.length}</b></div><div><span>Fraudeurs</span><b class="neg">${fr.length}</b></div><div><span>Verbalisés</span><b class="warn">${ca.length}</b></div><div><span>Amendes</span><b class="pos">${fmt$(ca.reduce((s,p)=>s+p.fine,0))}</b></div>
   <div><span>Billets vendus</span><b>${fmt$(all.reduce((s,p)=>s+(p.paid||0),0))}</b></div><div><span>Âge moyen</span><b>${Math.round(age)} ans</b></div><div><span>Femmes</span><b>${Math.round(all.filter(p=>p.woman).length/Math.max(1,all.length)*100)} %</b></div><div><span>Satisfaction</span><b class="stars">${avg.toFixed(1)} ★</b></div></div>`;
  const stats=`<details class="pstats"><summary>📊 Statistiques du trajet</summary><div class="pgrid">${barList('Nationalités',topList(all,'nat',7),all.length,k=>natOf(k).f+' '+esc(natOf(k).n))}${barList('Motifs du voyage',topList(all,'why',7),all.length)}
     ${barList('Venus à la gare en…',topList(all,'how',7),all.length)}${barList('Montés à',topList(all,p=>stationName(p.from),7),all.length)}${barList('Classe',topList(all,'cls',3),all.length)}${barList('Métiers',topList(all,'job',7),all.length)}</div></details>`;
  const filt=`<div class="chips">${[['all','TOUS'],...(live?[['onboard','À BORD']]:[]),['fraud','FRAUDEURS'],['caught','VERBALISÉS'],['free','NON CONTRÔLÉS'],['happy','SATISFAITS'],['sad','MÉCONTENTS']].map(([k,l])=>`<button class="${PAXUI.f===k?'on':''}" data-act="paxf" data-v="${k}">${l}</button>`).join('')}</div>
   <div class="two"><label>Gare<select data-pst="1"><option value="">Toutes les gares</option>${M.st.map(s=>`<option value="${s.c}" ${PAXUI.st===s.c?'selected':''}>${esc(stationName(s.c))}</option>`).join('')}</select></label><label>Rechercher<input data-pq="1" value="${esc(PAXUI.q)}" placeholder="Nom, nationalité, métier…"></label></div>
   <div class="mut">${L.length} voyageur(s)${L.length>PAXUI.n?' · '+PAXUI.n+' affichés':''}</div>`;
  const list=L.slice(0,PAXUI.n).map(p=>{ const open=PAXUI.open===p.id, ini=(p.first[0]+p.last[0]).toUpperCase(), col=AV[(p.last.charCodeAt(0)+p.first.length)%AV.length];
    const badge=p.fraud?(p.caught?'<i class="pbadge warn">VERBALISÉ</i>':'<i class="pbadge neg">SANS BILLET</i>'):'';
    return `<div class="paxc ${open?'open':''}" data-act="paxo" data-v="${p.id}"><div class="pav" style="background:${col}">${ini}<span>${p.flag}</span></div>
      <div class="pmain"><b>${esc(p.first)} ${esc(p.last.toUpperCase())}</b> ${badge}<small>${p.age} ans · ${esc(p.natn)} · ${esc(p.job)}</small><small>${esc(stationName(p.from))} → ${esc(stationName(p.to))} · ${p.km} km</small></div>
      <div class="pmood" title="Satisfaction">${stars(p.mood)}</div>
      ${open?`<dl class="pdet"><dt>Statut</dt><dd>${esc(paxStatus(tr,M,p))}</dd><dt>Nationalité</dt><dd>${p.flag} ${esc(p.natn)}</dd><dt>Sexe, âge</dt><dd>${p.woman?'Femme':'Homme'}, ${p.age} ans</dd><dt>Métier</dt><dd>${esc(p.job)}</dd>
        <dt>Monté(e) à</dt><dd>${esc(stationName(p.from))} (${esc(COUNTRIES[STATIONS[p.from].c][0])})</dd><dt>Descend à</dt><dd>${esc(stationName(p.to))}</dd><dt>Venu(e) à la gare</dt><dd>${esc(p.how)}</dd><dt>Pourquoi ce voyage</dt><dd>${esc(p.why)}</dd>
        <dt>Bagages</dt><dd>${esc(p.bag)}</dd><dt>Billet</dt><dd>${p.fraud?'<span class="neg">Aucun billet</span>':esc(p.cls)+' · '+fmt$(p.price)+(p.price===0?' (enfant, gratuit)':'')}</dd><dt>Place</dt><dd>Voiture ${p.seat.split('-')[0]}, place ${p.seat.split('-')[1]}</dd>
        ${p.fraud?`<dt>Fraude</dt><dd>${esc(p.excuse)}${p.caught?` · <b class="warn">contrôlé(e) à ${esc(stationName(p.ctrlAt))}</b> · amende ${fmt$(p.fine)} (${esc(p.fineNote)})`:' · <span class="neg">pas contrôlé(e)</span>'}</dd>`:''}
        <dt>Avis</dt><dd>${stars(p.mood)} ${esc(p.comment)}</dd></dl>`:''}</div>`; }).join('');
  const more=L.length>PAXUI.n?`<button class="go wide" data-act="paxmore">VOIR PLUS (${L.length-PAXUI.n} restants)</button>`:'';
  return sheet('PASSAGERS',head+stats+filt+`<div class="paxl">${list||'<div class="empty">Aucun voyageur pour ce filtre.</div>'}</div>`+more+`<div class="mut">Voyageurs fictifs générés par le jeu ; leur nombre, leurs gares et la fraude correspondent exactement au trajet.</div>`); }
function mCargo(){ const tr=trainById(PAXUI.id); const x=tr&&(PAXUI.which==='last'?tr.last:tr.trip), lots=x&&cargoOf(tr,x); if(!lots) return sheet('FRET','<div class="empty">Pas de fret.</div>');
  return sheet('MANIFESTE DU FRET',`<div class="prev">${esc(stationName(x.stops[0].c))} → ${esc(stationName(x.stops[x.stops.length-1].c))} · <b>${x.tons} t</b> en ${lots.length} wagon(s)</div>
   <table><tr><th>Wagon</th><th>Marchandise</th><th>Tonnes</th><th>Client</th></tr>${lots.map(l=>`<tr><td>${l.wagon}</td><td>${esc(l.what)}</td><td>${l.t}</td><td>${esc(l.client)}</td></tr>`).join('')}</table><div class="mut">Clients fictifs.</div>`); }
