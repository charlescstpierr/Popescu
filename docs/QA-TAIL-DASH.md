# Travestia : charge arrière à queue raidie

La deuxième attaque alterne avec la queue hélicoptère. Huit peintures entières reprennent le modèle approuvé, dos au déplacement, queue droite et touffue en tête de charge. Les images de Toma et le premier atlas de Travestia restent inchangés.

## Mécanique
- Direction verrouillée parmi huit orientations dès la préparation.
- Couloir annoncé pendant 1,3 seconde, sans dégâts ni déplacement du boss.
- Charge arrière de 0,6 seconde à 400 px/s, queue portée à 80 px; couloir de 44 px de large avec extrémités arrondies.
- Aucun recalage sur la cible après l'annonce; esquive latérale possible.
- Dégâts 26 avant difficulté, une fois par cible. La visibilité entre boss et cible empêche la frappe à travers un mur.
- Déplacement atomique sur le couloir, vérification des obstacles tous les 6 px maximum. Une collision arrête la charge, sans glissement latéral.
- Récupération inoffensive de 1,4 seconde, puis délai de 2,4 secondes avant reprise des attaques.
- Charme et Mode avion interrompent l'attaque; la pause fige le mouvement.

## Sauvegarde
Format 3, compatible en lecture avec les formats 1 et 2. Les trois phases (`tail_dash_windup`, `tail_dash`, `tail_dash_recover`) et tous les champs associés sont validés. Les tests reprennent avant la charge, pendant la charge avant/après une frappe et pendant la récupération, dans les huit orientations, sans répétition des dégâts.

Champs nouveaux de l'ennemi: `tailAttackCount` (alterne les attaques), `tailDashDir` (index 0–7), `tailDashX`, `tailDashY` (origine du couloir), `tailDashDistance` (distance déjà parcourue). Les champs communs existants `phase`, `tailTime`, `tailHitPlayer`, `tailHitGirl` restent indispensables. Aucun Set, Map ou pointeur supplémentaire.

## Vérification
- 175 tests Node réussis, sans échec.
- Revue indépendante de mécanique, sauvegarde, huit poses et rendu de jeu. Le glissement diagonal découvert en revue a été corrigé et couvert par un test.
- HTML autonome réexporté, démarrage et décodage de tous les atlas testés par adaptateur DOM et Canvas natif.
- Sauvegarde/reprise via les fonctions réelles de l'application testée dans chacune des trois phases; découvertes conservées.
- Preuves dans `proof/tail-dash/`: phases.png, directions.png, gameplay.mp4 et standalone.png.

Les preuves sont produites par les vrais moteur/rendu, pas par un mockup. L'adaptateur DOM n'est pas un navigateur physique. Toucher et performances iPhone/Android restent à vérifier. La récupération utilise la même peinture directionnelle tenue, donc la pose reste raide pendant l'arrêt. Aucun déploiement effectué par cette tâche.
