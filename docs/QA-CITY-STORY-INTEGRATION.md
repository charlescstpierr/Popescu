# QA — Intégration de la ville et des conversations

4 novembre 2026. Base GitHub : `08b1c3f6d25a177bcf1378a998feb39a7c186df2`.

## Contenu

La ville variée et les conversations causales sont combinées sans conflit. Les changements de décor restent dans le rendu et les fonctions descriptives du biome. Les conversations utilisent leur curseur sauvegardé, les réponses propres à chaque contexte et les scènes réellement lues. Les détails sont dans `QA-VARIED-CITY.md` et `QA-STORY-CONVERSATIONS.md`.

## Vérification de la version combinée

- Les 287 fichiers disponibles de la base locale correspondent exactement aux empreintes Git de la base distante. Les 14 anciens PNG source absents du poste sont conservés dans le manifeste et doivent rester inchangés dans l'arbre GitHub. Le patch ne les supprime pas.
- `npm test` : 803 tests réussis, aucun échec ni test ignoré.
- `python3 scripts/export-standalone.py release/Toma_Popescu_JOUER.html` : HTML autonome régénéré depuis les modules combinés.
- `node scripts/inspect-standalone.cjs /tmp/popescu-city-story-standalone.png` : syntaxe, démarrage, images, jeu, découvertes, affichage HUD, rendu sans mutation, pause/reprise, sauvegarde/reprise, attaques de Travestia et Péli, calendrier des boss et épilogue de Charles réussis.
- `node scripts/inspect-varied-city.mjs /tmp/popescu-city-story-render-proof` : les 14 vues à 320 ou 390 pixels de large passent; le rendu reste sans mutation et les pixels visibles sont identiques avec ou sans élimination des objets hors écran. Les 405 zones déterministes et leurs collisions restent identiques à la référence.

- `node scripts/inspect-story.mjs` : quatre parcours diagnostiques de vingt minutes (graines 42 et 1729, avec et sans compagne), 48 sauvegardes/reprises exactes, 81 contrôles de lecture avant réponse, sortie de Charles et passage en mode infini réussis. L'invulnérabilité temporaire sert à vérifier le récit, pas à mesurer l'équilibrage.
- Revue indépendante du code et des images : 90 tests ciblés réussis, aucun défaut bloquant trouvé.
- `git diff --check` réussi.

Les rapports JSON de cette étape restent conservés séparément; ils ne font pas partie de la livraison finale. Les scripts listés permettent de les régénérer.

## Limites et livraison

Les inspections de l'export et du décor utilisent un adaptateur DOM et Canvas natif. Elles ne valident pas un vrai navigateur, le toucher, les safe areas ou les performances sur téléphone physique. Aucun nouvel atlas ou dessin source n'a été généré. Cette intégration ne publie ni ne fusionne rien.
