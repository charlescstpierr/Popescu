# Cohérence de Toma entre les angles — 6 novembre 2026

## Cause et correction

Le signalement concernait le changement apparent de personne aux virages. Les anciennes feuilles avaient des proportions et expressions différentes : front/volume du crâne plus faibles de face, visage plus carré au trois-quarts, silhouette arrière différente. Le moteur affichait déjà des corps entiers sans déformation; modifier uniquement l'interpolation des angles n'aurait pas corrigé ces dessins.

Les huit feuilles ont été rééditées à partir des photos fournies et de références communes. Les propositions au visage trop dur ou aux angles incorrects ont été rejetées. Le nouvel atlas `toma-whole-v8.png` conserve les quatorze directions, les huit phases de course et le grand écart. Chaque figure reste entière et connectée. Aucun fondu de silhouettes, assemblage de membres, cisaillement ou rotation supplémentaire n'est ajouté.

Le recalage garde la cellule 144 × 128, l'ancre `[65,111]` et une hauteur médiane de course de 80 px. Les canons S et SSE ont été relevés à nouveau. Le secours de chargement est encodé sans perte depuis les figures E courantes. Les atlas et sources historiques v5/v6/v7 restent inchangés.

## Vérifications du candidat isolé

- Base vérifiée par le blob GitHub de `SOURCE_MANIFEST.json` du commit `12df3567747cdd3983d2b768de01ce62956b96ff`. Tous les fichiers présents de ce manifeste correspondent. La copie locale omet certains documents de preuve et sources historiques non concernés; leurs entrées du manifeste sont conservées.
- Test du chargement : échec constaté avec l'ancien atlas chargé, réussite avec v8. Les 27 tests ciblés héros passent.
- `npm test` : 1 625 réussis, 0 échec, 0 ignoré.
- Export hors ligne régénéré, même point d'entrée et mêmes clés de sauvegarde.
- Préparation reproduite octet pour octet pour l'atlas, les métadonnées et le recalage.
- Inspection native : 112 images de marche, 112 étapes de grand écart, huit phases distinctes, station et maintien stables, 120 contrôles de canon.
- Séquence comparative de 8 secondes / 240 images : véritable `Game.update` et renderer, cible tournante sur les quatorze directions, marche et demi-tours; le rendu ne modifie pas la simulation.
- Moteur, pose/visée, renderer, sauvegardes, introduction et dialogues inchangés. Les tests de sauvegarde restent inclus dans la suite complète.

## Coût et limites

L'atlas reste 1152 × 2048 : 9 Mio décodés, identique à v7. Le PNG passe de 641 449 à 676 289 octets (+34 840). Le code de rendu effectue toujours un seul dessin de cellule complète. Dans la séquence native finale, après dix images d'échauffement, médiane/p95 du renderer : 1,67/2,52 ms pour v8 contre 1,88/3,02 ms pour v7. Ces mesures ponctuelles ne prouvent pas un gain et ne remplacent pas un essai sur téléphone physique.

La ressemblance et la continuité des silhouettes exigent une revue visuelle, pas uniquement des tests. La séquence a été fournie à un reviewer indépendant avec les photos, le comparatif des angles, les phases et les repères de canon. Avis indépendant favorable : aucun défaut bloquant trouvé, même identité sur les quatorze vues, appuis/corps/nuque cohérents et sorties de canon correctes. Revue de 64 images chronologiques de la vidéo, pas une lecture temps réel; les quatorze orientations restent discrètes. Pas de publication automatique ni de migration de sauvegarde par ce changement.

## Intégration après PR67

Intégré sur main `5b2997e1e389e1d2a971b0c6e05f20796be90bd0`. Les sources et portraits des compagnes PR67, les textes associés et leurs tests sont conservés. Les sources Toma sont identiques au candidat revu. Exports dossier et monofichier régénérés; nouvelle séquence native comparative. Suite complète : 1 627 tests réussis, 0 échec, 0 ignoré. Une seconde revue indépendante vérifie cette intégration.
