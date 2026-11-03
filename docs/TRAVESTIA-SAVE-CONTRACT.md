# Champs à conserver pour une reprise fidèle

Travestia reste un élément de `state.enemies`, avec les champs habituels `id`, `type: 'travestia'`, `x`, `y`, `hp`, `maxhp`, `r`, `speed`, `cooldown`, `charmed`, `dead`, `hitFlash` et `phase`.

Champs supplémentaires de cet ennemi:
- `tailTime`: temps restant de la phase, en secondes.
- `phase`: `chase`, `tail_windup`, `tail_spin`, `tail_recover` ou `suppressed`. Conserver exactement.
- `tailWarning`: durée initiale de préparation, 1.2 ou 4.2; sert à l'anneau de progression.
- `tailFaceX`: orientation verrouillée (-1 ou 1).
- `tailHitPlayer`, `tailHitGirl`: booléens déjà frappé pour cette attaque. Ne jamais les réinitialiser à la reprise d'une rotation.
- `tailTauntAt`: instant minimal du prochain échange, relatif à `state.elapsed`.
- `tailBanterIndex`: index du prochain échange.
- `tailReplyPending`: réponse de Toma encore attendue.
- `tailReply`: texte de la réponse déjà sélectionnée.
- `tailWalkDistance`: distance réellement parcourue, pour la phase de course.
- `tailMoving`: mouvement réel lors du dernier pas de simulation.

Autre nouveauté: `game.timers.travestia`, temps avant prochaine tentative d'apparition. Valeur initiale 240 secondes. Pour une ancienne sauvegarde sans ce champ, ajouter 240 au chargement plutôt que laisser `undefined` devenir `NaN`.

Conserver aussi les champs de jeu existants `state.elapsed`, `speechUntil`, `pendingStuntReply` et `pendingRivalReply`: leurs échéances sont utilisées ou décalées pour garder les échanges lisibles. Si le format de sauvegarde remplace les temps absolus par des temps relatifs, convertir `tailTauntAt` avec la même méthode. Aucun nouveau Set/Map, callback ou référence DOM à sérialiser.

Tests d'intégration de reprise à ajouter par l'équipe de sauvegarde:
1. Au début et à la fin de `tail_windup`, même cercle et même temps restant; réponse encore attendue produite exactement une fois.
2. Pendant `tail_spin`, cible déjà frappée ne subit pas une seconde frappe; cible hors du cercle reste indemne. Même peinture/phase.
3. Pendant `tail_recover`, aucune frappe et même temps restant.
4. Pendant une interruption charme/Mode avion, aucune réponse fantôme ni attaque ressuscitée.
5. En pause et lors d'une course, aucun avancement hors simulation; `tailWalkDistance` maintient la peinture.
6. Après chargement, un seul Travestia actif et échéance d'apparition conservée.
7. Ancienne sauvegarde sans Travestia: migration du timer, aucune régression des héros/découvertes.
