# 🚆 Hakvision Rail

Jeu de gestion ferroviaire dans le navigateur (HTML + JavaScript, sans compilation) : bâtissez la grande compagnie de chemin de fer
du **Congo** (RDC et Congo-Brazzaville), puis étendez-vous à l'Afrique et au monde.

## Jouer
- En local : ouvrez `index.html` via un petit serveur (`npx http-server .` puis http://localhost:8080).
- En ligne : GitHub Pages (voir plus bas). Sur iPhone : Safari → Partager → « Sur l'écran d'accueil » (appli installable, fonctionne hors-ligne).

## La carte
Une vraie carte fabriquée pour le jeu (aucun service en ligne nécessaire) :
- **relief ombré** calculé à partir des altitudes et profondeurs du monde entier (tuiles Terrarium de Mapzen, AWS Open Data),
  couleurs naturelles (forêt équatoriale, savane, déserts, glaciers, fonds marins), plus de détail sur l'Afrique, l'Europe et le Congo ;
- **voies ferrées sur leur tracé réel** (Natural Earth) : 445 tronçons sur 459 suivent les courbes des vraies lignes, longueurs réelles ;
- fleuves, lacs, frontières, noms des pays, des mers et des régions (Sahara, bassin du Congo, Katanga…) ;
- moteur **MapLibre GL** : zoom fluide, rotation, **vue 3D inclinée** ; trains animés qui suivent les courbes.

Fichiers : `map/packs/` (tuiles WebP empaquetées), `map/fonts/` (Noto Sans, licence OFL), `mapdata.js`, `rails.js`.
Outils pour les régénérer : `tools/build_relief.py`, `tools/build_rails.py` (+ `tools/export_net.js`), `tools/build_mapdata.py`.

## Le jeu
Jeu de gestion de trains en temps réel (accéléré), centré sur le **Congo** :
- **Hubs dans le monde entier** : chaque ligne part d'un de vos hubs ; établissez-en au Congo, en Afrique, en Europe, en Russie, en Inde, en Chine, en Amérique, en Océanie (444 gares, 79 pays, fenêtre MONDE pour voyager).
- **Arrêts au choix** : un trajet direct ou les gares cochées une à une (Kinshasa–Matadi passe par 11 villes). Voyageurs en attente dans chaque gare, montées et descentes à chaque arrêt, voyageurs à bord en direct.
- **Manifeste des passagers** : pour chaque trajet, chaque voyageur (fictif) avec nom, âge, nationalité, métier, gare de montée et de descente, moyen d'arrivée à la gare, motif du voyage, classe, prix, place, bagages, fraude (verbalisé ou non), avis ; statistiques, filtres et recherche. Manifeste du fret par wagon.
- **Contrôleurs et contraventions** : fraude selon la région, contrôleurs à bord (0 à 4), amendes encaissées ; vitesse réglable, mise au garage, subvention, nom et couleur des lignes.
- **Une ligne = un train.** Au DÉPÔT → ITINÉRAIRES, choisissez un train, une gare de départ et d'arrivée sur le vrai réseau
  (Matadi–Kinshasa, réseau SNCC du Katanga et du Kasaï, Congo-Océan, corridor de Lobito, TAZARA…).
- **Faire partir** les trains depuis la liste « À LA GARE » ; ils roulent sur la carte ; à l'arrivée la recette tombe.
- **Gazole et énergie** à acheter au prix du marché (il change toutes les 10 minutes), **usure** et **entretien**.
- **Dépôt** : flotte, itinéraires, commande de trains (livraison en quelques minutes), emplacements limités.
- **Objectifs** et **points**, **boutique** (en points du jeu uniquement), **niveaux** qui débloquent du matériel,
  **pilote automatique**, **cours de l'action** de votre compagnie, **finances** et emprunts, messages.
- Les trajets continuent quand le jeu est fermé. Sauvegarde automatique (compte claude.ai ou navigateur).

Les noms de trains, illustrations et textes sont propres à ce jeu.

## Architecture (voir le brief d'origine)
| Fichier | Rôle |
|---|---|
| `index.html` | page, styles, chargement des scripts |
| `data.js` | Congo et Afrique : pays, régions, gares, voies, matériel |
| `data-world.js` | reste du monde : gares, voies, écartements B et R, trains, villes de départ, régions de la carte |
| `network.js` | graphe des voies, plus court chemin compatible, profils de vitesse, itinéraires avec arrêts |
| `game.js` | état unique `G`, trains, itinéraires, départs/arrivées, carburant, usure, objectifs, boutique, sauvegarde |
| `passengers.js` | manifeste des passagers et du fret (génération déterministe, fenêtre « Passagers ») |
| `map.js` | carte MapLibre : relief, couches, voies, lignes, gares, trains animés, vue 3D |
| `ui.js` | barre du haut, menu, liste des trains, fenêtres, sauvegarde en ligne |
| `sw.js`, `manifest.json` | appli installable, hors-ligne |

Principes : **la position d'un train est une fonction du temps** (calculée depuis l'horaire), un seul état `S` sauvegardé,
les arrivées pendant l'absence sont traitées à la réouverture.

## Tests
```
node tests/game.test.js                      # logique : itinéraires, départs, arrivées, absence, sauvegarde
node tests/artifact.test.js                  # interface (Playwright), bureau + mobile, rechargement
node tests/artifact.test.js page.html        # page autonome dans un cadre isolé (comme sur claude.ai)
```

## Honnêteté sur les données
Coordonnées et populations : approximatives. Vitesses, états des voies, coûts, demandes, horaires des concurrents et actualités :
**estimés ou fictifs**, pour le jeu. Les opérateurs cités existent, mais leurs chiffres dans le jeu sont simulés.

## Publication sur GitHub Pages
Dans le dépôt GitHub : *Settings → Pages → Source : GitHub Actions*. Chaque push sur `main` lance les tests puis publie le jeu.

Crédits : [MapLibre GL JS](https://maplibre.org) (BSD-3), [Natural Earth](https://www.naturalearthdata.com) (domaine public), altitudes [Mapzen Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (sources : SRTM, GMTED, ETOPO1… libres), polices Noto Sans (OFL).
