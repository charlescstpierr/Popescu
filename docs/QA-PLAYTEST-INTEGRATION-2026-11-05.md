# Intégration des correctifs de jeu — 5 novembre 2026

## Base et périmètre

Ce candidat local réintègre quatre corrections préparées sur `f8d698ea` dans main `dc2519e8e5b67552ddea4a1d5e3b520de531dfc9` de `charlescstpierr/Popescu`. Il conserve les PR #44, diversité des choix de progression, #45, alertes contextuelles de la compagne, et #46, annulation sûre du démarrage différé (#40). Les rapports du 4 novembre restent disponibles comme historique; leurs anciens compteurs et tailles ne décrivent pas ce candidat.

- #38 : les rebonds de Cœur viral utilisent le corps aérien du crapaud, avec le point d’impact capturé avant une mort ou un charme.
- #39 : Péli et Travestia ne consomment une paire et ne programment sa réponse que si sa première réplique ou sa scène en pause a été acceptée.
- Échap ferme les réglages depuis leurs quatre contrôles existants, sans reprendre la partie ni modifier les autres touches natives.
- Trois symboles de boutons utilisent des SVG décoratifs pour éviter les glyphes manquants : pause et deux flèches nord-est. Leurs boutons, noms accessibles, couleurs et tailles restent ceux du jeu.

Le patch source s’applique sans conflit sur cette base. Les changements applicatifs concernent seulement `app.js`, `engine.js`, `evolutions.js`, `index.html`, `pelican.js` et `travestia.js`. Aucun dessin ni atlas n’est régénéré. Les textes de dialogue, paramètres de combat, contrôles tactiles, format v15 et clés de sauvegarde sont conservés.

## Vérification

- Les 412 fichiers matérialisés de la base correspondent aux empreintes de main. Les 54 fichiers distants absents localement restent hors du patch et sont conservés dans l’inventaire.
- Suite complète sérielle : **1 391 tests réussis, zéro échec et zéro test ignoré** (`node --test --test-concurrency=1 tests/*.test.js`).
- Sous-ensemble regroupant les quatre corrections et les trois PR récentes : **121 réussites**.
- Contrôle négatif sur la base actuelle, avec le nouvel adaptateur reconnaissant les inputs : **18 échecs attendus et cinq comportements déjà corrects** parmi les 23 nouveaux tests. Tous les 23 passent sur le candidat. Les 21 scénarios croisés ajoutés par la revue indépendante sont conservés dans `tests/settings-start-integration.test.js` et inclus dans les compteurs finaux de 1 391 et 121.
- `git diff --check` est propre. Les deux exports sont reproduits octet par octet après régénération.
- Les trois contrôles natifs du dossier hors ligne passent dans la suite complète. Les trois inspecteurs ont aussi été exécutés sur le monofichier : démarrage, images, rendu sans mutation, pauses, sauvegardes et reprises passent.
- Le module de tirage, les conditions contextuelles, la file de parole, l’ordre des modules dans l’export et le module de sauvegarde des PR récentes restent inchangés. Leurs tests restent actifs dans la suite.
- Revue indépendante favorable, sans défaut bloquant : **394 tests réussis** (368 régressions existantes, 21 combinaisons nouvelles Échap/verrou/focus/navigation, cinq contrôles SVG/export), **9 600 comparaisons de simulation** et **64 restaurations croisées v15**. Les 64 images actives sont inchangées. Les SVG extraits du vrai HTML sont lisibles aux tailles 20, 17, 9 et 8 px; cette inspection native ne constitue pas une validation CSS dans un navigateur.

## Exports

Le point d’entrée reste `release/Toma_Popescu_JOUER.html`, accompagné des 32 fichiers de `release/assets/`. Il fait **650 711 octets**, SHA-256 `0c5a450263a484c7fb88159ea12d0a2be54d6cd9126ec43ee5ca8a1996007c1b`.

Le monofichier facultatif sous `generated/standalone/` fait **27 431 465 octets**, SHA-256 `addbd0ced36e0367f3a685080eacc06479e9b8d9547de645d91f3065754ac85c`. Ce fichier généré n’est pas une nouvelle livraison courante et n’est pas inclus dans le patch.

## Coordination avec les autres travaux

Le ticket #40 est déjà fusionné dans cette base par la PR #46. Le module `run-save.js`, son adaptateur de chargement et ses 25 tests sont inchangés; dans `app.js`, seule l’exception Échap est ajoutée au contrôleur combiné. La revue couvre aussi Échap pendant le chargement, avant acquisition d’un Web Lock natif et après commit, ainsi que la perte de focus et la navigation: ancienne sauvegarde intacte avant acquisition, nouvelle partie en pause après commit, crédits uniques et résolutions tardives des images neutralisées.

Le ticket #41, activation des boutons HUD par Espace, reste distinct et n’est pas corrigé ici. Son intégration peut toucher `app.js` et `tests/helpers/focus-controller.js`, également modifiés ici.

1. Relire le head distant avant toute publication. Si main a avancé, appliquer les changements source sur cette nouvelle base, sans copier des fichiers complets depuis ce candidat.
2. Combiner les gardes du gestionnaire clavier et les améliorations de l’adaptateur de focus sans annuler les changements des autres tickets. Le gestionnaire clavier tient sur une longue ligne, donc un conflit textuel ne doit pas être résolu en choisissant un fichier entier.
3. Conserver les 54 fichiers non matérialisés et tous les autres blobs en utilisant l’arbre distant comme base; ne jamais reconstruire le dépôt depuis cette copie partielle.
4. Actualiser l’inventaire, régénérer le dossier hors ligne depuis le code combiné et relancer la suite complète sérielle, les tests de focus/clavier et les régressions #38/#39/#40/#44/#45.
5. Faire vérifier ce résultat combiné avant PR ou fusion. Aucun envoi GitHub ni déploiement du Site n’a été effectué pour ce candidat pendant cette préparation.

## Limites

Les contrôles utilisent le moteur, le vrai contrôleur dans un adaptateur DOM et Canvas natif. Ils ne prouvent pas le comportement dans un navigateur réel, les politiques `file://`, les interactions tactiles ou les performances sur téléphone physique. Les symboles peuvent être inspectés en raster natif, sans que cette inspection certifie leur résolution CSS réelle.

Le retest navigateur du précédent candidat était bloqué par l’accès au serveur du conteneur et la politique `file://`; aucun contournement n’est utilisé ici. La validation réelle devra passer par un aperçu officiel ou un environnement connecté autorisé. Ce candidat n’est pas déployé pour effectuer cette validation.
