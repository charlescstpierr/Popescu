# Ouverture interactive : candidat isolé

Base : `/workspace/scratch/937a83d91318/travestia-tail-dash`.
Candidat : `/workspace/scratch/937a83d91318/toma-opening-interactive`.
Aucune publication.

## Livré

- Trois cartes courtes : photo fantasmée, panne, rue réelle.
- Bouton « Améliorer ma vie », « Tout passer », clavier Entrée/Espace/Échap, bouton « Revoir l’intro » au menu.
- Les deux panneaux narratifs utilisent la planche révisée approuvée, conservée octet pour octet et cadrée par CSS. Aucun nouveau personnage généré.
- La rue utilise le rendu réel et le sprite entier approuvé. Tous les assets préexistants sont identiques à la base.
- Premier gorille ordinaire, délai de six secondes avant les apparitions régulières. Chrono et simulation arrêtés jusqu’au premier déplacement; tirs automatiques inchangés ensuite.
- Tutoriel compact et désactivable; aide disparaissant après huit secondes de partie.
- Premier checkpoint atomique sur la première carte, reprise au même texte, état du tutoriel sauvegardé et validé.
- Relecture indépendante de la sauvegarde active. Intro non imposée aux parties suivantes.

## Vérification effectuée

- `npm test` : 183 tests réussis, dont 8 nouveaux cas d’ouverture et d’intégration.
- `node scripts/inspect-opening.mjs` : rendu natif 390 × 844 et 320 × 568, sprite réel, un seul gorille, déplacement et tir automatique.
- Régression découverte et corrigée : le gorille était figé au début de son fondu d’apparition lorsque le chrono attendait le déplacement. Il est désormais entièrement visible pendant cette attente. Test natif dédié.
- Vérification binaire de tous les anciens assets et de la planche approuvée.
- Export autonome régénéré : `release/Toma_Popescu_JOUER.html`.

## Limites avant livraison finale

Le navigateur cloud n’accède pas au serveur de ce conteneur (`http://127.0.0.1:8034`, connexion refusée). Les images de `proof/opening/` sont issues du vrai moteur Canvas mais n’incluent pas le DOM/CSS. Le cadrage des panneaux, les boutons, le tactile et le flux complet doivent encore être contrôlés dans une prévisualisation navigateur accessible, sans remplacer prématurément la version publiée.

La relecture au menu montre les trois cartes et revient au menu; elle ne modifie jamais la partie sauvegardée. Une première partie ayant déjà `introSeen` conserve ce comportement et n’affiche pas automatiquement la nouvelle introduction; « Revoir l’intro » reste disponible.
