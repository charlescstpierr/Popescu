# Vérification de l'intégration records et dialogues

Date : 4 novembre 2026 (UTC).

## Base et périmètre

Base GitHub : `e25fb766ec051035aa09a22d5e32eb4500ba9472`.
Les 278 fichiers disponibles ont été vérifiés octet par octet contre les identifiants
de blobs de cette version. Les 14 PNG historiques de sources artistiques absents
de la copie locale sont inchangés et doivent rester dans le dépôt distant.

Ce candidat réunit l'historique et les records par difficulté/mode, la cause fatale
factuelle, le calendrier de lecture partagé et sa sauvegarde. Aucun dessin,
portrait, CSS, structure HTML, texte de dialogue existant ou réglage de combat
n'est modifié. Le HTML autonome est régénéré depuis les modules combinés.

Les propositions narratives et visuelles du rapport d'audit ne sont pas mises
en œuvre par cette intégration.

## Raccordements vérifiés

- Le format de sauvegarde v11 accepte les enveloppes v1 à v10. Les métadonnées
  de records sont ajoutées en mémoire à la lecture d'une ancienne sauvegarde,
  sans réécrire le stockage ni attribuer une difficulté à l'ancien record.
- Une sauvegarde v10 conserve un Charles déjà actif. Son initialisation n'est
  réservée qu'aux versions antérieures à v10.
- L'état de lecture actif, la file bornée, l'historique, les totaux et les crédits
  partagent le stockage atomique existant. Un refus d'écriture ne publie rien.
- Victoire, Charles, sortie de Charles et infini gardent une victoire de survie
  unique, puis un résultat infini distinct. Les réessais ne dupliquent rien.
- Le module `speech` précède ses consommateurs dans l'export ; `run-history`
  précède le moteur. Les 35 modules respectent leur ordre de dépendance.

La revue indépendante a découvert un arrondi flottant lors d'une interruption
dans la même étape : `4.300000000000001` secondes dépassait la borne de `4.3`
et refusait une sauvegarde légitime. Le temps restant est maintenant plafonné
à la durée de lecture exacte. Une régression reproduite puis corrigée couvre
les temps 0, 10, 35, 1200 et 5000 secondes.

## Résultats

- `npm test` : **769 tests réussis, aucun échec**.
- Cinq tests d'intégration supplémentaires couvrent l'arrondi, la migration v10
  de Charles, la parole interrompue associée à une défaite réelle, les écritures
  refusées et le parcours Charles → infini.
- Revue indépendante : **67 tests ciblés réussis**, aucun blocage restant.
- `git diff --check` : réussi.
- Export autonome : **14 252 671 octets**.
- Inspection de l'export réel avec Node et Canvas natif : syntaxe, démarrage,
  images, découverte, HUD, rendu sans mutation, pause/reprise, sauvegardes,
  attaques de Travestia et Péli, calendrier des boss et épilogue Charles réussis.

## Limites et précaution d'intégration

Le jeu partage déjà une source aléatoire entre certains intervalles de dialogue
et le combat. Corriger le moment des répliques peut donc changer les trajectoires
d'une même graine. Aucune formule de combat ou d'XP n'est modifiée. Le test du
stock d'XP distant conserve ses assertions contre la collecte à distance et les
améliorations en chaîne ; il exige au moins 200 XP non ramassés plutôt qu'un total
incidentel strictement égal à 222.

Les preuves Canvas/Node ne remplacent pas un navigateur réel, un téléphone
physique ni une évaluation du confort de lecture. Aucune publication, fusion
ou mise en production n'a été effectuée pendant cette intégration.
