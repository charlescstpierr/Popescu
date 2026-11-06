# Lisibilité du combat : une seule passe de danger

Le rendu des avertissements hostiles passe après les personnages, véhicules et effets alliés. Les formes existantes restent identiques : cône orang-outan, couloir de charge, anneau du coq, zones et ouvertures des boss. Cette passe existait déjà au premier plan pendant une Lamborghini active; elle est maintenant cohérente avec ou sans voiture. Elle n'est jamais dupliquée et reste désactivée pendant l'arrivée verrouillée de Charles.

Le gaz conserve son dessin au sol. Ses seules bouffées décoratives de premier plan sont retirées, afin de ne plus verdir et masquer les poses des personnages. Le mode effets réduits utilisait déjà uniquement cette couche de sol.

Aucun équilibrage, dialogue, atlas, bâtiment, contrôle, sauvegarde ou géométrie d'attaque n'est modifié. Aucun nouveau cache raster, contour supplémentaire ou mémoire persistante n'est ajouté. Ce correctif ne reprend pas le prototype précédent d'ouvertures des bâtiments et de contours supplémentaires, rejeté pour son coût.

## Vérifier

- `node --test tests/combat-layer-order.test.js tests/explosive-warning.test.js tests/charles-arrival-render.test.js tests/lamborghini-art.test.js`
- `node --test --test-concurrency=1 tests/*.test.js`
- `node scripts/inspect-combat-layers.mjs CHEMIN_BASE CHEMIN_CANDIDAT CHEMIN_PREUVES`

Le dernier script produit douze captures 390 × 844 et six comparaisons appariées de rendu Canvas natif, avec et sans effets réduits. Chaque paire partage exactement le même état de jeu; l'ordre est alterné. Quatre images de chauffe puis vingt images mesurées, lecture RGBA comprise. La scène mobile déplace la caméra à chaque image; ce n'est pas une simulation complète de partie. Le stress contient exactement 300 ennemis et 90 nuages. Le script vérifie que chaque rendu laisse la simulation inchangée.

Les mesures courtes sur Canvas natif ne prouvent ni une fréquence d'images sur téléphone physique, ni la fluidité tactile, ni le coût DOM/HUD. Une revue des captures doit confirmer la visibilité des personnages et les ouvertures des attaques avant intégration. La copie de travail n'est pas une publication.

## Vérification historique avant intégration

Sur la copie isolée issue de PR63 : 1 620 tests réussis, zéro échec, zéro ignoré. Exports hors ligne et monofichier régénérés. Revue indépendante des captures : pas de défaut bloquant, couloir et anneau mieux visibles; la foule demeure chargée et les captures ne certifient pas l'accessibilité aux déficiences de vision des couleurs.

Mesure répétée après la suite, p50 avant → après (millisecondes) : foule effets réduits 20,01 → 19,95; foule standard 15,51 → 15,58; caméra mobile réduits 15,24 → 15,10; caméra mobile standard 17,23 → 15,80; stress réduits 55,78 → 55,87; stress standard 77,59 → 57,59. Les deux faibles hausses (+0,46 % et +0,16 %) ne permettent pas de conclure à une régression mesurable dans cet échantillon; aucun gain mobile n'est promis. La première passe simultanée aux tests est conservée mais n'est pas le résultat de référence.

`inspect-combat-motion.mjs` accepte les mêmes trois chemins et produit maintenant 32 paires de captures de vraie simulation : huit instants espacés de six mises à jour de 1/60 s, avec et sans Lamborghini, en mode normal et réduit. Le cas voiture/effets réduits était déjà au premier plan avant ce correctif : ses images identiques prouvent la préservation, pas une amélioration. Il sert à inspecter les transitions et superpositions, sans mesurer les performances. Un premier essai sans chauffe et concurrent aux exports a aussi chronométré ces huit images (+7 % sur la médiane); cet essai trop court et perturbé n'est pas utilisé comme benchmark et ses traces sont conservées séparément.

## Intégration sur main après PR68

Base GitHub vérifiée : `60ecb47ab258b09b942232170470356218d05dd1`. Les PR66–68 sont conservées : introduction approuvée, quatre nouveaux personnages féminins, Toma v8. Seul `dist/renderer.js` change dans le produit; atlas, géométrie des attaques, moteur, contrôles et sauvegardes restent identiques. Les exports sont régénérés, et les 83 fichiers historiques absents de la copie locale sont conservés par leur arbre GitHub.

Les nouvelles captures utilisent réellement les assets main68. Les 32 paires animées avancent `Game.update`, et les 12 captures de scène comparent exactement le même état. Le rendu ne modifie pas la simulation. Aucun test sur téléphone physique ni déploiement du Site n’est revendiqué.

Suite générale intégrée : **1 634 tests réussis, zéro échec, zéro ignoré**. Revue indépendante : 45 tests ciblés réussis, géométrie, arrivée verrouillée de Charles, sauvegardes, marche et reproductibilité des exports vérifiées. Inspection indépendante des rendus statiques et animés : aucun défaut bloquant, anneaux/couloirs plus continus et acteurs moins masqués; la foule reste dense. Les images voiture/effets réduits identiques sont explicitement une vérification de préservation.

Mesure main68 répétée après la suite, isolée sur un cœur CPU : p50 avant → après (ms), foule réduite 19,01 → 18,96; foule normale 17,19 → 15,69; caméra réduite 12,55 → 12,55; caméra normale 17,63 → 16,16; stress réduit 56,39 → 56,37; stress normal 76,43 → 55,81. Échantillons courts Canvas natif uniquement, pas de promesse mobile. La passe simultanée aux tests est conservée séparément et n’est pas le résultat de référence.
