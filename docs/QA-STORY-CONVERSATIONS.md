# Dialogues causaux et histoire courte

Date : 4 novembre 2026. Base : `08b1c3f6d25a177bcf1378a998feb39a7c186df2`.

## Périmètre

- Les 16 vantardises de grand écart ont chacune un identifiant stable et leur propre réponse. Les 16 provocations ont deux réponses écrites pour le coq et le bouc. Aucun choix de réponse par modulo dans les nouvelles conversations.
- Six scènes courtes : première horde réellement présente, compagne locale hors ligne et premier choix réel parmi char, vérité, billets et abonnés. Chaque scène a trois lignes, sans menu ni arrêt du combat.
- Le rappel de dix minutes et les répliques de victoire dépendent d'une scène entièrement lue. Une amélioration seule, une scène cachée ou une scène fermée ne débloque pas ce rappel.
- L'ouverture conserve ses trois cartes et ses actions. Elle relie la photo générée, la panne, les créations incontrôlables et l'objectif de vingt minutes. Charles conserve son épilogue optionnel et ses règles; son dialogue suit maintenant les preuves du char, des doigts, de la villa, puis la vraie victoire de Toma.
- Les 98 lignes des nouveaux échanges et scènes ont au maximum 67 caractères. Les vantardises sont celles de Toma, pas des faits sur les personnes citées.

## Lecture et compatibilité

Le calendrier existant garde sa durée `max(4,3 s, longueur × 0,039)`. Le curseur d'une scène contient son identifiant, ses lignes exactes, l'index courant, son acteur éventuel et son contexte. Une alerte interrompt immédiatement; la ligne interrompue reprend son temps restant avant la réponse. La fermeture annule la suite; mort, disparition, charme du rival et indisponibilité de la compagne invalident les scènes correspondantes.

Le réglage de bavardage suspend le temps de lecture facultatif. Les alertes restent disponibles. Réactiver les échanges reprend la même ligne, sans attribuer de lecture au temps caché. Les seuls changements dans `app.js` synchronisent ce réglage et transmettent les scènes terminées à la réplique de victoire; aucune présentation n'est modifiée.

Sauvegarde v12 : migration des versions 1 à 11, maintien des anciens textes en attente et des scènes modales stockées, des records, trophées, boss et de Charles. Les anciennes réponses indexées restent exclusivement pour les sauvegardes qui les avaient déjà programmées. Les nouvelles scènes sont validées avec un maximum de quatre lignes et la file conserve son plafond de seize. Même des interruptions répétées ne peuvent évincer l'unique ligne rattachée au curseur sauvegardé.

## Vérification

- `npm test` : 794 tests réussis, aucun échec.
- Régressions ciblées : réponse exacte de chaque paire, interruption à chaque ligne, sauvegarde/reprise exacte, annulation, acteur disparu ou charmé, compagne indisponible, bavardage coupé/réactivé, fermeture, limite de file, désactivation exactement à l'échéance de lecture et validation des sauvegardes malformées.
- Revue indépendante : aucun blocage restant; 77 tests ciblés réussis après correction de la limite de file.
- Export autonome régénéré et exécuté avec l'adaptateur DOM/Canvas : syntaxe, démarrage, images, rendu sans mutation, sauvegarde/reprise, découvertes, Travestia, Péli, calendrier aléatoire des boss et Charles réussis.
- `git diff --check` réussi.
- Le test des hordes vérifie maintenant les vrais appels et heures d'apparition (20 s puis 45 s plus tard), au lieu de compter une plaisanterie facultative que le calendrier peut omettre pendant une autre phrase.

Les dessins, portraits, atlas, CSS, structure HTML, génération de ville, rendu, statistiques de combat et calendrier aléatoire des boss restent inchangés. Le fichier autonome doit être régénéré après toute combinaison avec un autre changement de `dist/`.

Ces vérifications ne constituent pas un test tactile sur téléphone physique ni une mesure de confort de lecture en situation réelle. Aucune publication ni fusion n'est effectuée par ce patch.
