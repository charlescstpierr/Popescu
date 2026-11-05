# Combinaison Charles et quatre créatures

## Première combinaison locale

Base vérifiée : `3681edd08e7581dd3fb33ab76fbc9d7d47594bff`, avec histoire #51, protections audio #48 et HUD #41. Les 430 fichiers matérialisés correspondent aux blobs GitHub; les 54 fichiers distants non matérialisés sont conservés par référence. Le nouveau Toma et le correctif #52 ne sont pas inclus dans cette première combinaison.

Périmètre ajouté : arrivée de Charles en vol et claquement, plus les six poses complètes de chacune des quatre créatures EGO. Les deux patches source sont appliqués sans remplacer les fichiers entiers de la base.

## Résolution des conflits

- Audio : `hit` reste prioritaire et `snap` est ajouté. Après retrait des seuls ajouts `snap`, le fichier est identique à celui de la base avec #48. Les règles de sélection et de protection des voix sont intactes.
- Renderer : la branche EGO garde `drawEgoForeground(..., reduced)` et les nouveaux repères `_enemyStatus`. Le foreground d'attaque est masqué pendant l'arrivée inoffensive. Corps, impacts, ombres et repères héritent de l'alpha d'effacement.
- Tests audio : le test du claquement est ajouté sans supprimer ni modifier les régressions de #48.

`content.js`, `app.js`, `run-save.js`, `index.html`, `styles.css` et tous les modules/atlas Toma sont identiques à la base de cette première combinaison. `ego-art.js` est identique au candidat quatre créatures. Dans `actor-art.js`, seules les deux multiplications d'alpha de Charles s'ajoutent au candidat EGO.

## Vérifications réalisées

- 283 tests ciblés avant les régressions combinées : tous verts.
- Quatre nouvelles régressions : les quatre EGO en préparation, action ou reprise restent inoffensifs, reprennent exactement après sauvegarde, ne donnent aucune récompense lors de leur disparition et effacent leurs repères avec leurs corps.
- Suite complète séquentielle : **1 507 / 1 507**, aucun échec ni test ignoré.
- Exports reconstruits : dossier hors ligne avec **34 assets**, HTML de 659 271 octets; monofichier de 28 174 019 octets.
- Captures du vrai Game/Renderer à 390×844 et 320×568, en normal et réduit; vidéo de l'arrivée et séquence indépendante des quatre créatures.

Les scènes combinées mettent volontairement les quatre EGO en `ego_active`, avec 55 % de santé et un impact encore actif, avant l'arrivée de Charles. Les anciens traits/langue/flash d'attaque ne restent pas affichés; les repères de santé, les corps et leurs impacts s'effacent ensemble. Toma et la compagne ne sont pas effacés. Le léger éclaircissement des créatures avant le claquement vient de cet impact forcé, pas de la couleur de leurs peintures.

Reproduction :

`node scripts/inspect-charles-arrival.mjs /tmp/charles-ego --ego`

`node scripts/inspect-ego-animation.mjs /tmp/ego-animation`

Les captures sont natives, sans HUD DOM, sans navigateur réel ni téléphone physique. Elles ne prouvent pas la fluidité ou les contrôles tactiles. Les coûts et les limites des benchmarks des candidats restent décrits dans leurs rapports respectifs; aucune mesure de foule mobile n'est déduite de cette combinaison.

## Revue de la première combinaison

La revue indépendante de cette première combinaison est favorable : 206 tests ciblés verts, exports recalculés identiques et scènes combinées inspectées. Aucun défaut bloquant démontré. Les limites navigateur, téléphone et foule dense restent explicites.

## Report final sur Toma #53

Base publiée : `8e6e230516597ba7f06d1ec7f5312e5163a29498`, tree `0ede73d95ace6b0d75a548187d2568517fb123f0`. Les 444 fichiers matérialisés ont été comparés aux blobs publiés, sans différence; les 54 références absentes restent préservées. Le diff source Charles + EGO est appliqué par hunks sur une nouvelle copie, sans nouveau conflit. Le correctif #52 est toujours exclu.

Les 35 fichiers Toma recensés sont identiques à la base, dont les atlas v5/v6, les nouvelles sources, les 14 directions, les scripts et les tests. `AGENTS.md`, `docs/REPRISE.md`, la sauvegarde, l'histoire, l'app et le HUD sont identiques au head publié. `engine.js` est identique à cette base après retrait des trois ajouts dédiés au verrou d'arrivée. Les déplacements `travelX/travelY`, les virages et la phase de marche continue de Toma restent intacts.

Vérifications finales :

- 306 tests ciblés, puis **1 517 / 1 517** tests complets exécutés séquentiellement, aucun ignoré.
- Exports reconstruits : **35 assets**, HTML de **670 049 octets**, monofichier de **28 498 885 octets**.
- Nouvelles captures et vidéos Charles + quatre EGO + Toma v6 aux deux tailles, en normal et réduit, avec sauvegarde/restauration exacte aux points échantillonnés.
- Carte Toma à 14 directions régénérée, identique à la carte du head publié : SHA-256 `26061e7d9442a273694073b320ec9690d941b28491c7ebdb35797560212fd802`.

La revue indépendante de ce report final est favorable, sans régression bloquante trouvée. Elle a exécuté 89 tests ciblés, comparé les 35 fichiers Toma aux blobs GitHub fournis, confirmé la préservation du moteur hors des trois hunks Charles et de l'audio hit hors ajout snap, reconstruit les deux exports à l'identique et vérifié les 473 empreintes locales du manifeste ainsi que les 54 références absentes. Les planches finales et images décodées des deux vidéos de 144 images à 24 i/s montrent l'effacement conjoint des quatre créatures, de leurs statuts et de leurs ombres, sans effacer Toma ni la compagne. Les preuves restent natives, pas un essai navigateur, HUD DOM, tactile ou téléphone. Aucune publication n'a été faite.
