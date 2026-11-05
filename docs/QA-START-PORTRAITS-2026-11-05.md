# Cohérence des portraits au démarrage

## Constat et correction

Le démarrage avec `introSeen: true` lance directement la partie, comme prévu. Cette règle n’est pas modifiée. Les petits portraits du HUD, des répliques en action, de la surface de dialogue et du résultat utilisaient encore `portrait-toma-v4.svg`, différent du nouveau visage demandé.

Ces quatre surfaces et l’icône du jeu utilisent maintenant `portrait-toma-current.webp`. Ce fichier de 160 × 200 pixels est un recadrage tête-épaules du portrait approuvé `dialogue-toma.png`, sans nouvelle peinture. Le script `node scripts/prepare-compact-portrait.mjs` le reproduit avec Canvas natif : rectangle source `[255,40,520,650]`, réduit en 160 × 200, WebP qualité 92. Le fichier pèse 15 772 octets. Il évite de décoder le grand portrait de 2,4 Mo uniquement pour le HUD.

Les deux cartes de l’introduction où Toma parle conservent son grand portrait fidèle. La carte SYSTÈME reste lisible sur le décor gelé, sans emprunter le visage d’un personnage. Le présentateur masque bien l’ancienne planche d’introduction dans le code; cette planche contient l’ancien visage barbu. Une restauration expérimentale a été retirée pour respecter la consigne récente de ressemblance et de grand portrait du locuteur. Aucun changement de mise en page ni du présentateur n’est livré.

Les portraits de Blonde IA, Charles et des boss, les sources artistiques, le grand portrait, la planche historique et l’atlas de Toma restent inchangés. Aucun changement du moteur, du stockage, de la simulation, d’AUTO, des commandes ni des clés de sauvegarde.

## Vérifications

Les nouveaux tests de ressources compactes ont échoué sur la base puis passé après correction. Les tests complémentaires couvrent : départ direct avec intro déjà vue, trois cartes d’intro et leurs actions, absence d’avancement automatique, reprise exacte sur SYSTÈME, transitions de locuteur et rejet des chargements d’image tardifs.

Les tests ciblés passent : 33 réussites. Les deux exports sont reconstruits; leurs tests natifs de fumée couvrent démarrage, images, rendu sans mutation, sauvegarde/reprise et scènes de boss. Sur le candidat final, `npm test` réussit : **1 577 tests, 0 échec, 0 ignoré**. Une première exécution parallèle du candidat intermédiaire avait échoué dans `offline-export.test.js`, la fumée du dossier hors ligne et `scenery-art.test.js`; leur cause exacte n’a pas été établie. Une suite complète séquentielle a ensuite passé, puis la suite parallèle complète du candidat final a passé sans changement de ces composants.

## Revue visuelle et limites

La revue indépendante a vu le nouveau fichier aux tailles réelles du HUD, de la réplique compacte, du dialogue et du résultat : visage lisible et cohérent avec le grand portrait. Une composition native indicative utilise les vrais assets et le vrai Renderer pour les trois cartes de l’intro en 320 × 568 et 390 × 844. Les actions sont présentes; les longues répliques peuvent nécessiter le défilement déjà prévu.

Ces contacts ne sont pas des captures navigateur et ne prouvent pas la résolution du CSS, les safe areas, les commandes tactiles ou les performances d’un téléphone. Aucun test navigateur de l’introduction cachée n’est revendiqué. Aucune publication du candidat n’a été faite pendant cette correction.
