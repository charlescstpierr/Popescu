# Introduction approuvée — 6 novembre 2026

Base : main 32590d1e4bfc1d3770a7ffa758a4717ddb9d9dcf, PR #65, Site v46. Tous les fichiers existants de la copie de base ont été vérifiés contre les empreintes du manifeste GitHub.

Les cinq répliques validées sont reprises littéralement, avec leurs vrais locuteurs Toma / Blonde IA / Toma / Blonde IA / Toma. Le théâtre existant est conservé : panne froide, vantardise dorée, retour dans la rue. Les grands portraits restent sélectionnés par line.who. La petite vignette historique, qui prêtait une réponse à un autre personnage, est masquée. La didascalie finale indique le retournement et l'arrivée des singes, sans ajouter de réplique.

Après la dernière validation, le tutoriel fait apparaître son vrai gorille existant et oriente le corps entier de Toma vers lui avec advanceHeroMotion. Pas de déformation du sprite, nouvelle minuterie, blocage d'entrée ou attente décorative. Le mouvement déclenche ensuite la simulation comme auparavant. Passer l'intro et la revoir depuis le menu gardent leurs comportements.

Aucun autre dialogue, asset, renderer, effet CSS, difficulté, clé de stockage ou format de sauvegarde modifié. Les anciens dialogues sauvegardés conservent leurs lignes et leur curseur exacts.

## Vérification

- Tests rouges observés avant changements pour texte, locuteurs, portraits, sortie et orientation finale.
- 102 tests ciblés réussis après mise à jour des anciennes attentes de trois cartes.
- Suite complète : 1625 tests réussis, aucun échec ni skip.
- Couverture supplémentaire : sauvegarde/reprise aux cinq index, et ancienne introduction trois cartes sauvegardée.
- Export hors ligne régénéré sans changer ses assets ni sa structure.

La première suite a révélé des attentes historiques de trois cartes et trois fixtures artistiques manquantes dans la copie isolée. Les attentes ont été adaptées au nouveau contrat ; les fixtures existantes ont été copiées sans modification avant le passage complet réussi.

## Revue indépendante et navigateur réel

Un second agent a relu le diff et parcouru les cinq cartes dans Chromium via la prévisualisation Sites officielle. Textes exacts, bons portraits, troisième réplique entièrement accessible par défilement, didascalie finale et action visibles. Revoir l’intro revient au menu sans modifier la sauvegarde affichée (20:00, niveau 12, record 1800). Les effets réduits sont inchangés et couverts par les tests CSS existants.

## Limites

Le retournement est un changement immédiat de vue peinte au démarrage du tutoriel, et non une cinématique supplémentaire. Pas de téléphone physique testé.

Le nouveau départ n’a pas été essayé dans le navigateur pour préserver la sauvegarde présente ; cette transition est couverte par les tests du contrôleur et du moteur. Les cartes sans didascalie conservent un espace de grille sous le bouton, sans empêcher lecture ni navigation.
