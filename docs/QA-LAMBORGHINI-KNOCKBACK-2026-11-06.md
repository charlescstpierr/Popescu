# Recul du pare-chocs et obstacles

## Défaut reproduit

Audit de main `74173ad42fc45c9e631266b2ca2575c805e0063d` (PR #62), sans retour de joueur allégué. Le recul du pare-chocs utilisait le déplacement ordinaire, qui vérifie seulement le point d'arrivée de chaque axe. Un ennemi peut donc traverser le bord d'un pin quand les deux extrémités sont libres.

Reproduction avec le vrai terrain : seed 42, pin `2,0:forest:5`, centre (1196,375), dimensions 20 × 18. Un tank à (1183,399.59) touché par une Lamborghini de rang 3 passait à x=1209. Son rayon de collision est 15,6 px : départ et arrivée sont libres, mais le trajet traverse le pin. Le tank reste vivant après les 116 dégâts.

## Correction limitée

`contacts` utilise désormais `Game.knockback`, déjà employé par Vérité et Harley. Le balayage du trajet bloque l'axe qui traverse l'obstacle. Les contacts restent identiques : dégâts, rang de lancement, largeur, vitesse, temporisation, nombre de voitures, une frappe par passage et exclusion des préparations d'attaque immobilisées. La tangence exacte et les obstacles détruits permettent toujours le recul entier.

Aucun nouveau calcul par image hors contact de pare-chocs. Le balayage ne s'exécute qu'après une frappe admissible sur un survivant; il réutilise les bornes de collision du monde. Pas de promesse de performance sur téléphone physique.

Aucun dessin, dialogue, format de sauvegarde, clé de stockage ou dépendance ne change. Les exports dossier et monofichier sont régénérés. Le monofichier reste dans le répertoire généré ignoré par Git.

## Vérifications

- Huit régressions échouent sur le code de base puis passent après correction, dont les rangs 2 à 5, les deux sens des rangs à retour, le dégât unique et la reprise sauvegardée. Les deux contrôles de tangence et d'obstacle détruit passent avant et après.
- 38 tests ciblés passent : recul Lamborghini, niveaux Lamborghini, collisions de Vérité/Harley.
- Les tests utilisent le moteur, les véhicules et les collisions du terrain réels. La preuve de pause/reprise avance le sous-système véhicule directement après restauration; elle ne prétend pas être une partie humaine.

Commandes :

```sh
node --test tests/lamborghini-knockback.test.js tests/lamborghini-levels.test.js tests/knockback-collision.test.js
python3 scripts/export-offline.py
python3 scripts/export-standalone.py
taskset -c 0 npm test
```

Limites : aucun essai navigateur ou téléphone physique. Aucun déploiement du Site.

Suite complète : **1 613 tests réussis, aucun échec ni test ignoré**, avec `taskset -c 0 npm test` (110,3 s). Les tests natifs d'exports ont donc été exécutés, pas ignorés.

## Revue indépendante

Avis favorable, aucun problème bloquant trouvé. 45 tests ciblés réussis. Contrôles complémentaires : 30 cas sur trois graines (17, 42, 831), rangs 2–5, aller/retour, pas de 0,9 s et 1/120 s; 32 états immobilisés ou boss protégés; deux contacts mortels sans déplacement. Une sauvegarde après impact puis 600 pas conservent l'état exact et les deux frappes de 82 dégâts au retour.

Microbenchmark Node synthétique : 300 ennemis et convoi complet, 72 000 contacts cumulés, exactement un balayage non nul par contact. Médiane d'environ 1,00 ms par convoi complet corrigé contre 0,39 ms avec l'ancien déplacement. Le coût supplémentaire est réel mais borné aux contacts; cette mesure n'est ni une image complète du jeu ni une mesure de téléphone. Aucun nouveau cache ou état sauvegardé.
