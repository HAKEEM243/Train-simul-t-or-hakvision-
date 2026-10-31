# 🏛️ Président — simulateur de chef d'État

Jeu mobile en français, dans l'esprit de Power & Revolution : gouverne l'un des 80 pays jouables.
Ministres, Conseil des ministres, institutions, économie et budget, ressources et usines, ménages types,
migrations mondiales, diplomatie, guerres, débats télévisés, famille royale…

Tout tient dans `index.html` (aucune compilation). Le jeu est une **application installable** :
`manifest.webmanifest` (nom, icône, plein écran) et `sw.js` (fonctionne sans internet).

## Mettre le jeu en ligne avec Cloudflare Pages (gratuit, environ 2 minutes)
1. Va sur https://dash.cloudflare.com → **Workers & Pages** → **Créer** → onglet **Pages** → **Se connecter à Git**.
2. Autorise GitHub et choisis le dépôt **Train-simul-t-or-hakvision-**.
3. **Branche de production** : `claude/jeu-train-congo` (ou `main` si tu fusionnes cette branche).
4. **Préréglage de framework** : *Aucun*. **Commande de build** : laisser vide. **Répertoire de sortie** : `president`.
5. Donne un nom au projet, par exemple `president-jeu`, puis **Enregistrer et déployer**.
6. Ton lien sera du type **https://president-jeu.pages.dev**. Chaque nouvel envoi sur la branche met le jeu à jour.

## Installer sur le téléphone
- **iPhone** : ouvre le lien dans Safari → bouton Partager ⬆️ → « Sur l'écran d'accueil ».
- **Android** : ouvre le lien dans Chrome → bouton « Installer l'application » dans le jeu, ou menu ⋮ → « Installer l'application ».

Les parties sont enregistrées sur l'appareil (💾 Sauvegardes → « Fichier et copie » pour les transférer).
Les dirigeants et personnages sont inventés ; les chiffres des pays sont des ordres de grandeur simplifiés.
