# Symboles de commandes — 4 novembre 2026

Rapport historique du 4 novembre. La base, les nombres de tests et les tailles d’export ci-dessous décrivent ce candidat antérieur, pas la livraison courante. Voir [la validation combinée du 5 novembre](QA-PLAYTEST-INTEGRATION-2026-11-05.md) sur main `dc2519e8e5b67552ddea4a1d5e3b520de531dfc9`, après les PR #44, #45 et #46.

## Défaut observé et périmètre

Le vrai navigateur Chromium affiche des rectangles creux à la place de trois glyphes : pause du HUD (`Ⅱ`), flèche de `REVOIR L’INTRO` (`↗`) et flèche de `TOUT PASSER` (`↗`). Les captures de référence sont `popescuFirstPlay.jpg`, `popescuCompanionReply.jpg` et `popescuFinalMenu.jpg` dans les preuves du test navigateur du 4 novembre. Les chevrons `›` et les flèches de relance `↻` sont lisibles et ne sont pas modifiés.

La copie de départ est `dist/` de main `f8d698ea4c038191ca4f24c2f855f2c71c009d22`, fournie dans `popescu-offline-folder-2204`. La correction se limite au contenu de trois boutons dans `dist/index.html`. Les caractères dépendant de la couverture Unicode de la police sont remplacés par leurs formes simples en SVG intégré : deux barres et une flèche nord-est.

## Conservation du comportement

- Les SVG héritent de la couleur existante avec `currentColor` et de la taille existante avec `1em`.
- Les identifiants des boutons, leurs classes, leurs textes et l’étiquette accessible de pause restent identiques.
- Les SVG sont décoratifs (`aria-hidden="true"`) et non focalisables (`focusable="false"`).
- Aucune police externe, image téléchargée, dépendance d’exécution, CSS globale ou modification des commandes n’est ajoutée.
- Les autres symboles, portraits, sprites, polices du texte et styles sont inchangés. Le moteur et les sauvegardes sont inchangés.

## Vérification

Deux tests de rendu ont échoué avant correction parce que les commandes dépendaient de glyphes de police. Après correction, le test rasterise les SVG extraits du vrai HTML sans utiliser de police pour leur géométrie. Il exige deux barres distinctes pour pause, la diagonale et la pointe pour les flèches, et l’absence de rectangle creux. Un test utilise le contrôleur réel pour pause/reprise, invocation/passer et revoir l’intro/passer.

`npm test` : **1 273 tests réussis, zéro échec, zéro test ignoré**. Le dossier hors ligne a été régénéré dans la copie isolée.

`scripts/inspect-control-symbols.mjs` génère une planche native des SVG réellement présents dans le HTML aux tailles 20, 17, 9 et 8 px, avec un agrandissement des pixels. Cette planche vérifie les formes, pas la résolution CSS d’un navigateur. La revue indépendante a confirmé le diff limité aux trois boutons, les contrôles inchangés et la lisibilité des formes aux quatre tailles. Ses 55 tests ciblés passent; la planche a été reproduite octet par octet. Elle a aussi vérifié la séquence asynchrone de retour au menu et les cibles de clic imbriquées.

## Limite explicite

Le défaut initial est prouvé par de vraies captures de navigateur. La correction n’a pas encore été chargée dans ce navigateur : les restrictions d’accès à `localhost` et `file://` ont été respectées, sans autre navigateur ni route de contournement. Aucune nouvelle capture réelle après correction n’est revendiquée. La validation finale en navigateur doit utiliser le flux d’aperçu ou de publication autorisé. Aucun envoi GitHub ni déploiement n’a été effectué par cette correction.
