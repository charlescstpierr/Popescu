# Corrections de l'audit du 4 novembre 2026

Rapport historique du 4 novembre. La base, les nombres de tests et les tailles d’export ci-dessous décrivent ce candidat antérieur, pas la livraison courante. Voir [la validation combinée du 5 novembre](QA-PLAYTEST-INTEGRATION-2026-11-05.md) sur main `dc2519e8e5b67552ddea4a1d5e3b520de531dfc9`, après les PR #44, #45 et #46.

## Périmètre

Base vérifiée : `f8d698ea4c038191ca4f24c2f855f2c71c009d22` de `charlescstpierr/Popescu`. Quatre corrections intégrées, sans modification des illustrations, textes, styles globaux ou du format de sauvegarde v15 :

- [#38](https://github.com/charlescstpierr/Popescu/issues/38) : Cœur viral choisit maintenant le corps aérien du crapaud comme les collisions ordinaires. Le point d'impact source est capturé avant les dégâts ou le charme, afin de conserver la bonne portée et la bonne origine du lien même si le crapaud meurt ou retombe.
- [#39](https://github.com/charlescstpierr/Popescu/issues/39) : Péli et Travestia ne consomment une paire et ne programment sa réponse que si la réplique initiale ou la scène en pause a été acceptée. Les répliques refusées par les réglages ou une file pleine restent disponibles pour la première rencontre visible.

- Échap ferme les paramètres lorsque Volume ou une des trois cases conserve le focus, sans reprendre la partie. Les autres touches et les champs étrangers restent protégés. [Rapport](QA-SETTINGS-ESCAPE-2026-11-04.md).
- Les trois glyphes manquants sont remplacés par leurs formes attendues en SVG décoratif : pause à deux barres et flèches nord-est. Taille et couleur héritées des styles existants. [Rapport](QA-CONTROL-SYMBOLS-2026-11-04.md).

Les sauvegardes anciennes sont conservées telles quelles. Le second correctif empêche la création de nouvelles réponses orphelines; il ne tente pas de deviner si une ancienne réplique sauvegardée a été entendue.

## Vérifications

- Suite complète combinée : **1 293 tests réussis, zéro échec, zéro test ignoré**.
- Vingt-trois tests ciblés ajoutés. Sur la base inchangée, dix-huit échouent et cinq contrôles de stabilité passent déjà. Sur le candidat, les vingt-trois passent. Le test de base utilise le nouvel adaptateur reconnaissant les vrais éléments input pour exercer le garde-fou clavier original.
- Cœur viral : visée, portée entrante et sortante, source survivante/morte/charmée, trajectoire et reprise exactes. Revue indépendante du correctif complet sans blocage.
- Dialogues : six régressions, puis revue indépendante de 143 tests ciblés, 4 800 comparaisons image par image de l'état de combat et du RNG, huit combinaisons de refus/reprise et seize allers-retours v15. Aucun changement des horloges de combat ni des réservations de parole constaté.
- Revue indépendante combinée : 106 tests ciblés/export réussis, contrôles natifs et touches maintenues des quatre réglages vérifiés, allers-retours v15 et formes SVG inspectés aux tailles 20/17/9/8 px. Aucun défaut bloquant.
- Les 64 fichiers d'images actifs, 32 dans `dist/assets/` et leurs 32 copies dans `release/assets/`, sont identiques aux empreintes Git de la base.
- Les modules de sauvegarde, dessin et pose du héros sont inchangés. Le changement de contrôleur se limite au passage d’Échap depuis les quatre réglages existants.

## Exports

Le dossier courant reste `release/Toma_Popescu_JOUER.html` avec `release/assets/`. Son HTML fait **645 180 octets**. L'export monofichier facultatif reste dans `generated/standalone/` et fait **27 425 934 octets**; il ne remplace pas le dossier courant.

Les deux exports ont été régénérés. Les trois inspecteurs natifs du dossier hors ligne (général, compagne, Lamborghini) et l'inspecteur général du monofichier passent : démarrage, images, rendu sans mutation, pauses, reprise, boss et quatre nouvelles bêtes. Les chemins et clés de stockage restent inchangés.

## Limites

Ces tests utilisent le moteur réel, un adaptateur DOM et Canvas natif. Ils ne certifient ni le navigateur réel, ni les politiques `file://`, ni les commandes tactiles, safe areas ou performances d'un téléphone physique. Aucun résultat natif n'est présenté comme une partie jouée dans un navigateur.

Le candidat n’a pas encore été chargé dans le vrai navigateur. Le navigateur de test ne peut pas atteindre le serveur de ce conteneur; `file://` est refusé et DevTools est désactivé par la politique du navigateur. Aucun contournement ni déploiement n’a été utilisé. Le retest attend un URL d’aperçu officiel ou un environnement local officiellement connecté au navigateur.

La revue de cohérence des dialogues détaille trois constats séparés qui ne sont pas inclus dans ces corrections : [rapport](QA-DIALOGUE-CONSISTENCY-2026-11-04.md).
