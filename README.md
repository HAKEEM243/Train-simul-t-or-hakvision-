# 🚆 Hakvision Rail

Jeu de gestion ferroviaire dans le navigateur (HTML + JavaScript, sans compilation) : bâtissez la grande compagnie de chemin de fer
du **Congo** (RDC et Congo-Brazzaville), puis étendez-vous à l'Afrique et au monde.

## Jouer
- En local : ouvrez `index.html` via un petit serveur (`npx http-server .` puis http://localhost:8080).
- En ligne : GitHub Pages (voir plus bas). Sur iPhone : Safari → Partager → « Sur l'écran d'accueil » (appli installable, fonctionne hors-ligne).

## Le jeu
Jeu de gestion de trains en temps réel (accéléré), centré sur le **Congo** :
- **Hubs dans le monde entier** : chaque ligne part d'un de vos hubs ; établissez-en au Congo, en Afrique, en Europe, en Russie, en Inde, en Chine, en Amérique, en Océanie (444 gares, 79 pays, fenêtre MONDE pour voyager).
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
| `ui.js` | carte, barre du haut, menu, liste des trains, fenêtres, sauvegarde en ligne |
| `world.js` | fond de carte Natural Earth simplifié (généré par `tools/build_world.py`) |
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

Crédits : [Leaflet](https://leafletjs.com) (BSD-2), fond de carte [Natural Earth](https://www.naturalearthdata.com) (domaine public).
