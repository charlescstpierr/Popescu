# Quatre animaux approuvés

Copie de travail isolée, non publiée. Les dessins suivent les quatre concepts approuvés : autruche fashion, ratonne paparazzi, orignale romantique et poule disco sur patins.

- Première rotation à 12, 26, 40 et 54 secondes; nouvelles arrivées toutes les 22 secondes, huit animaux actifs maximum. Les arrivées ne changent pas le générateur aléatoire des vagues existantes.
- Autruche : verrouille son trajet pendant 0,8 seconde, sprinte, récupère et choisit une nouvelle direction au prochain départ.
- Ratonne : annonce un cône de flash pendant 1,1 seconde; aucune occultation de l'écran ni immobilisation du joueur.
- Orignale : annonce un couloir pendant 1,2 seconde, charge sans corriger sa trajectoire et récupère.
- Poule : annonce son disque pendant une seconde, puis tourbillonne dans ce disque fixe. Un seul dégât par attaque.
- Les préparations ne blessent pas; les obstacles arrêtent les charges et bloquent les coups. Charme et Mode avion annulent immédiatement l'attaque. Les avertissements ne disparaissent pas en effets réduits.
- Sauvegarde v4, migration des sauvegardes v1–v3; les phases, directions, positions de départ, progression et impacts déjà subis sont conservés. Une cible exactement superposée utilise une direction stable.

## Preuves

`proof/animals/in-game-warning.png` et `in-game-active.png` proviennent du vrai Renderer, avec monde et Toma d'origine. Le rendu est en lecture seule. Une revue visuelle indépendante a confirmé les quatre identités, l'absence de découpage et les différences entre avertissement et danger. Plusieurs attaques superposées peuvent rendre le centre plus chargé.

Les tests couvrent l'arrivée précoce, le plafond de population, les avertissements sans dégâts, l'esquive, le trajet verrouillé, la récupération, les interruptions, les obstacles, un seul impact, les sauvegardes de toutes les phases et les sauvegardes après charme/superposition.

Le HTML autonome a été régénéré et vérifié : syntaxe, démarrage, images embarquées, partie, pause/reprise et sauvegarde. Canvas natif ne remplace pas une validation sur téléphone physique.

## Illustration

Atlas transparent généré avec l'outil intégré à partir du concept approuvé, 4 × 4 poses complètes dans `dist/assets/animals-approved.png`. Prompt : préserver les tenues et couleurs, quatre pas d'autruche; deux pas et préparation/flash de ratonne; deux pas et préparation/charge d'orignale; deux pas et préparation/tourbillon de poule. Aucun changement aux pixels des atlas de Toma.
