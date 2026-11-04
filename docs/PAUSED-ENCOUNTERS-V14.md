# Conversations importantes en pause · sauvegardes v14

Les scènes approuvées utilisent le dialogue modal existant. Le navigateur active cette capacité pour les nouvelles parties et les reprises. Le moteur reste utilisable sans cette option pour les simulations et les anciennes intégrations.

## Déclenchements

- Péli Zodiaque et Travestia : premier échange admissible de chaque espèce dans la partie, avec les deux répliques déjà écrites. La réplique différée correspondante est remplacée uniquement si la mise en file réussit. Les provocations suivantes et les avertissements de combat restent compacts.
- Charles : les huit répliques existantes, dans leur ordre, par étapes de deux. Une reprise ancienne au milieu d'une paire ne répète pas sa première réplique. Les nouvelles étapes attendent la fin des répliques narratives anciennes encore en cours. Le dialogue ne s'ouvre que pendant intro, hover, recover ou empowered, après revalidation de la phase.
- Blonde IA : l'acquisition initiale reste l'unique déclencheur des cinq répliques existantes. L'invocation attend les améliorations et trophées prioritaires sans disparaître. Elle reste visible lorsque les répliques facultatives pendant l'action sont désactivées.

Les demandes produites pendant une étape de simulation sont mises en file. L'ouverture intervient après l'étape complète, jamais entre les dégâts et leur résolution. Mort, victoire et choix de récompense gardent leur priorité. Les récompenses de survie déjà en attente restent dormantes pendant l'épilogue Charles, jusqu'au mode infini.

## Lecture et commandes

Chaque nouvelle scène commence en lecture manuelle. AUTO est facultatif et s'arrête lorsque la fenêtre perd le focus ou devient cachée. Une reprise de focus redonne une durée de lecture complète; un ancien callback ne peut avancer une nouvelle réplique. Entrée/Espace maintenus, double-clics et pressions très rapprochées ne consomment pas plusieurs lignes. Les entrées de déplacement et la capture tactile sont libérées à l'ouverture et à la fermeture. Espace conserve le défilement natif lorsque le texte possède le focus.

Les projectiles, dégâts, apparitions, effets, expirations, RNG et horloges de simulation restent figés pendant le dialogue. Passer une scène ne modifie pas les attaques sauvegardées. Quitter Charles invalide ses scènes restantes avant le retour à la victoire.

## Contexte de présentation

`game.dialoguePresentation(line)` fournit le locuteur, l'identifiant de scène, le type et l'identifiant du personnage rencontré, la portée, et le portrait de compagnon courant. Le contexte du personnage rencontré reste présent lorsque Toma répond. Pour l'invocation, `actorType` vaut `companion` sur les cinq lignes et `actorId` vaut `null`.

Le rang de la Blonde IA est recalculé depuis `s.upg.girlfriend`; aucun rang ni chemin de portrait figé n'est sauvegardé. Les cinq portraits existants restent les références de progression. Le nouveau portrait de présentation du rang 1 dispose d'un repli vers son portrait existant.

## Persistance

La version 14 est volontairement incompatible avec les lecteurs v13, qui ne savent pas restaurer les pauses et leurs curseurs. Les sauvegardes v13 migrent sans changer leurs anciens champs de jeu, trajectoires, XP, records, RNG, files de parole ou répliques différées.

Le nouvel état contient une scène active, une file bornée à sept identifiants uniques, les résultats de consommation et au plus deux anciens identifiants de boss. Les boss dont un échange ancien a déjà commencé terminent cet échange normalement. Une nouvelle rencontre ultérieure reste admissible. Une invocation v13 déjà ouverte reçoit son contexte en conservant exactement ses cinq lignes et son index.

Le curseur moteur est la source de vérité des scènes importantes. Sauvegarde et reprise vérifient son accord avec les lignes UI, l'acteur et le résultat de consommation. Une scène active restaurée reste en pause même si une autre intégration n'active pas la capacité de nouvelles scènes.

## Vérification et limites

Les tests couvrent chaque locuteur, les files, la migration, le rejet par le lecteur v13 original, les priorités, la mort et les acteurs obsolètes, Charles et ses avertissements, les entrées répétées, AUTO/focus et le contrôleur réel. Les adaptateurs DOM ne prouvent pas à eux seuls le comportement d'un téléphone physique. La validation visuelle des portraits et des tailles d'écran est distincte des tests du moteur.

Validation finale du 4 novembre 2026 : 1 118 tests réussis, aucun échec. L'export autonome de 26 028 757 octets a été exécuté avec le vrai moteur et Canvas natif : démarrage, images embarquées, dialogue Péli et banter compact, sauvegardes des phases de boss, directeur d'apparitions, épilogue Charles et sortie ont réussi. Les tests de publication atomique des captures et de liens symboliques restent actifs et réussissent.
