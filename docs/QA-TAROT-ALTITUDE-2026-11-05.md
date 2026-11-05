# Tarot flatteur et Crapaud Alpha en saut

## Défaut et périmètre

Audit de code et reproduction déterministe de la copie publiée de la PR #59 (`993b70b5c0cb2ffb2d3c5cf6a7a9843ccd998437`). Aucun retour de joueur humain n'est allégué. Aucun doublon précis trouvé parmi les 19 tickets et 39 PR examinés le 5 novembre 2026.

La carte de Tarot flatteur utilisait l'ancre au sol pour choisir sa cible, vérifier la portée et infliger ses dégâts. Les projectiles ordinaires utilisent déjà le centre corporel fourni par `Game.targetPosition`. Au sommet du saut, le corps du Crapaud Alpha est 110 px au-dessus de son ancre : une carte passant sur son ombre infligeait 18 dégâts sans toucher le corps, tandis qu'un corps à environ 172 px pouvait être refusé parce que son ancre était à environ 269 px.

Le correctif utilise le centre corporel pour l'acquisition, l'orientation initiale, la collision rectangulaire balayée et l'ordre des victimes. La cible et le trajet restent verrouillés au lancement; la collision suit le corps courant à chaque passage. Aucune peinture, animation, attaque de Charles, fonction de sauvegarde ni clé de stockage n'est modifiée. Les autres trophées, dont le secteur au sol de Coup de panache, sont inchangés.

## Règles conservées

- Acquisition dans un rayon de 220 px, départ au point de lancement et retour au même point.
- Carte de 24 × 36 px, trajet de 220 px, durée de 1,6 s et recharge de 8 s.
- 18 dégâts par passage, trois victimes distinctes maximum, une frappe par victime à l'aller et une au retour.
- Exclusion des morts et alliés charmés, ordre géométrique et départage par ID, aucun nouveau tirage aléatoire.

## Vérifications

- Neuf nouveaux tests échouent tous sur la base et passent après correction : visée, portée dans les deux sens, cible la plus proche, vrais dégâts au corps et absence de dégâts à l'ombre, frontière rectangulaire, ordre des trois victimes et progression réelle du saut dans `Game.update`.
- Suite complète finale : **1 595 tests réussis, aucun échec ni test ignoré**, après ajout de la neuvième régression moteur. Une première passe de 1 594 tests était également verte avant ce dernier ajout.
- Revue indépendante favorable : 71 tests ciblés, plus 100 scènes au sol et 15 000 mises à jour comparées à l'ancienne implémentation, avec état complet et RNG identiques.
- Le lancement parallèle indépendant avait quatre échecs d'export/processus graphiques. Les contrôles hors ligne passent isolément après reconstruction, puis toute la suite passe en limitant les processus simultanés avec `taskset -c 0 npm test`. Aucun échec n'est masqué ou test ignoré.
- Comparatifs du vrai Renderer avec Canvas natif à 390 × 844 et 320 × 568, effets normaux et réduits. La carte passe maintenant sur le corps et non sur l'ombre. La hauteur reste figée au sommet dans ces comparatifs contrôlés; le test moteur distinct avance réellement le saut. Le rendu ne modifie pas la simulation.
- Les exports dossier et monofichier sont reconstruits depuis les mêmes modules. Aucun asset source ne change.

## Reproduire

Depuis la racine :

```sh
node --test tests/tarot-altitude.test.js tests/trophy-effects.test.js tests/trophy-engine.test.js tests/trophy-save.test.js tests/ego-combat-integration.test.js
python3 scripts/export-offline.py
python3 scripts/export-standalone.py
taskset -c 0 npm test
```

`taskset` est un outil Linux; ailleurs, `node --test --test-concurrency=1 tests/*.test.js` limite également le parallélisme. Les captures locales ne sont pas des pièces publiées dans le dépôt. Pas de test navigateur ou téléphone physique, ni de conclusion sur l'équilibrage ressenti ou les performances mobiles.

## Intégration sur les animations de Charles

Le correctif est réappliqué sur `0b7c88239ef87b213f14ad3e4b73b32eaaf52b52` (PR #60). Tous les fichiers Charles, son atlas, le Renderer et le moteur restent identiques à cette base. Les exports incorporent les douze poses de Charles et la correction du Tarot. Les fichiers historiques absents de la copie de travail sont préservés dans l’arbre GitHub; aucune suppression n’est prévue.

Validation finale du combiné : **1 603 tests réussis, aucun échec ni test ignoré** avec `taskset -c 0 npm test`. Revue indépendante favorable, 85 tests ciblés combinés réussis et comparaison des fichiers présents aux blobs distants. Le seul module runtime modifié est `dist/trophy-effects.js`; les deux exports et le manifeste sont reconstruits. Le ticket associé est [#61](https://github.com/charlescstpierr/Popescu/issues/61). Aucun déploiement du Site n’est inclus.
