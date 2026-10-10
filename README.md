# 🚆 Hakvision Rail

Jeu de gestion ferroviaire dans le navigateur (HTML + JavaScript, sans compilation) : bâtissez la grande compagnie de chemin de fer
du **Congo** (RDC et Congo-Brazzaville), puis étendez-vous à l'Afrique et au monde.

## Jouer
- En local : ouvrez `index.html` via un petit serveur (`npx http-server .` puis http://localhost:8080).
- En ligne : GitHub Pages (voir plus bas). Sur iPhone : Safari → Partager → « Sur l'écran d'accueil » (appli installable, fonctionne hors-ligne).

## Le jeu
- **~200 gares** dont **70 au Congo** : Kinshasa, Matadi, Boma, Lubumbashi, Kolwezi, Likasi, Kananga, Mbuji-Mayi, Kisangani, Kindu,
  Kalemie, Ilebo, Goma, Bukavu, Brazzaville, Pointe-Noire, Dolisie… et des hubs dans le monde (Lobito, Dar es Salaam, Johannesburg,
  Nairobi, Casablanca, Le Caire, Paris, Londres, Tokyo, Shanghai, New York…).
- **Réseau réel simplifié** : Matadi–Kinshasa, réseau SNCC (Katanga, Kasaï, Maniema), Congo-Océan, Benguela (corridor de Lobito),
  TAZARA, Zambie, Afrique du Sud, SGR Tanzanie et Kenya, LGV européennes, Shinkansen…
  Les voies congolaises sont **usées** (20 à 50 km/h) ; certaines sont **hors service** (Uele, Mayumbe, COMILOG).
- **Écartements** (voie du Cap 1067 mm, métrique, normale 1435 mm) et **électrification** : le matériel doit être compatible.
- **Voyageurs** (modèle gravitaire selon population et distance) et **fret** (cuivre-cobalt de Kolwezi, Likasi, Tenke ; manganèse ;
  importations des ports vers les grandes villes).
- **Chantiers** : remise en état, modernisation, électrification, doublement, changement d'écartement, construction de voies neuves
  et **grands projets** (pont Kinshasa–Brazzaville, chaînon Kinshasa–Ilebo, Ubundu–Kindu, port de Banana…).
- **Concurrents** (SNCC, SCTP, CFCO, Lobito Atlantic Railway, TAZARA, SNCF, JR…) avec horaires fixes, et des challengers fictifs.
- **Événements** : saison des pluies, éboulements, pannes, cours du cuivre.
- **Hubs** : chaque ligne part d'un de vos hubs.
- **Finances** : emprunts, frais fixes, péages, bilans hebdomadaires.

## Architecture (voir le brief d'origine)
| Fichier | Rôle |
|---|---|
| `index.html` | page, styles, chargement des scripts |
| `data.js` | pays, régions économiques, gares, voies, projets, matériel, lignes concurrentes |
| `network.js` | graphe des voies, plus court chemin compatible, profils de vitesse, itinéraires avec arrêts |
| `sim.js` | état unique `S`, calendrier fixe, économie, horloge (`advance` par pas de 5 min), IA, sauvegarde, rattrapage hors-ligne |
| `ui.js` | carte Leaflet (fond vectoriel hors-ligne), panneaux, actions |
| `world.js` | fond de carte Natural Earth simplifié (généré par `tools/build_world.py`) |
| `sw.js`, `manifest.json` | appli installable, hors-ligne |

Principes : **la position d'un train est une fonction du temps** (calculée depuis l'horaire), un seul état `S` sauvegardé,
calendrier hebdomadaire fixe à l'heure locale, rattrapage du temps passé hors du jeu (30 jours max).

## Tests
```
node tests/sim.test.js          # logique : itinéraires, économie, 1 an simulé, sauvegarde, rattrapage
node tests/ui.test.js           # interface (Playwright) : bureau + mobile, rechargement, absence simulée
```

## Honnêteté sur les données
Coordonnées et populations : approximatives. Vitesses, états des voies, coûts, demandes, horaires des concurrents et actualités :
**estimés ou fictifs**, pour le jeu. Les opérateurs cités existent, mais leurs chiffres dans le jeu sont simulés.

## Publication sur GitHub Pages
Dans le dépôt GitHub : *Settings → Pages → Source : GitHub Actions*. Chaque push sur `main` lance les tests puis publie le jeu.

Crédits : [Leaflet](https://leafletjs.com) (BSD-2), fond de carte [Natural Earth](https://www.naturalearthdata.com) (domaine public).
