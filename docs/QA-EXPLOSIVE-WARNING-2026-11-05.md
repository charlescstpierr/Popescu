# Avertissement de l’explosif : portée fidèle

## Défaut reproduit

La gorille explosive prépare son attaque pendant 0,72 s. L’avertissement générique montrait un cercle d’environ 34 à 38 px, mais l’explosion de rayon 87 touchait le centre de Toma jusqu’à 99 px, marge de contact de 12 px comprise.

La reproduction dans le vrai moteur déclenche l’attaque à 60 px, puis place Toma à 90 px. Toma reste hors de l’ancien cercle, mais perd 23 PV au déclenchement. À 98 px, les dégâts sont identiques; à 99 et 100 px, il n’en subit aucun. Le rendu applique la même translation caméra à la zone et aux acteurs.

## Correction

`EXPLOSIVE_BLAST` partage le rayon de 87 px et la marge de 12 px entre `Game.explode` et `Renderer._dangerWarnings`. Pendant toute la préparation, une zone légèrement remplie et un contour pointillé stable indiquent les 99 px pertinents pour le centre du joueur. Le contour ne se rétracte pas avec les pulsations. Il reste visible en effets réduits et au-dessus d’une Lamborghini qui le couvrirait.

Aucun changement aux dégâts, au déclenchement, à la préparation, aux collisions, au RNG, aux sprites ou aux sauvegardes. Le pulse d’impact conserve son rayon de 87 px. Les autres attaques conservent leur présentation.

## Vérifications de publication

Candidat réintégré sur main `8e6e230516597ba7f06d1ec7f5312e5163a29498`, avec les quatorze directions de Toma conservées.

- Les tests de géométrie et de pixels échouent sur cette référence avant correction, puis passent après correction.
- Les 7 tests ciblés couvrent le rayon fixe de 99 px à différentes horloges et dans les deux modes d’effets, les dégâts à la frontière, l’absence de mutation de simulation, la disparition du dessin après annulation ou mort, et la superposition au-dessus d’une voiture.
- Revue indépendante du code et des captures natives avec l’atlas actif v6 : aucun défaut bloquant. Le contour reste stable pendant toute la préparation, sur le décor réel et au-dessus de la Lamborghini. Les interruptions réelles par Mode avion, charme par cœur et défaite retirent immédiatement l’avertissement.
- Suite complète séquentielle : 1 471 tests réussis, aucun échec ni test ignoré, avec `node --test --test-concurrency=1 tests/*.test.js`.
- Exports dossier hors ligne et monofichier régénérés et vérifiés. L’ordre des modules initialise le moteur avant le rendu. Les 33 images distribuées restent identiques octet pour octet.
- Publication construite à partir de l’arbre GitHub existant et des seuls fichiers modifiés. Les 54 sources artistiques et preuves historiques non matérialisées localement restent intactes.

## Limites

La QA graphique utilise Canvas natif, y compris une scène isolée pour comparer précisément les portées. Elle ne certifie ni le toucher, ni les performances, ni le comportement d’un navigateur sur téléphone physique. Les tests de disparition caractérisent l’état sans préparation; les mécanismes d’interruption existants ne sont pas modifiés.
