# Intégration de toutes les animations

## Base et périmètre

Base publiée : main `8e6e230516597ba7f06d1ec7f5312e5163a29498`, après Toma #53. Tree vérifiée : `0ede73d95ace6b0d75a548187d2568517fb123f0`.

Cette intégration réunit le lot Charles + quatre créatures EGO et le lot des ennemis ordinaires, sur le Toma publié. Le correctif d'avertissement explosif #52 est volontairement exclu : son rayon et son ancien avertissement ne sont pas changés ici.

Le candidat Charles + EGO a été figé et ses empreintes vérifiées avant la copie d'intégration. Les sources sont fusionnées par blocs, sans remplacer les fichiers partagés par un ancien fichier complet. Les fichiers générés ne sont pas repris d'un lot : exports et manifestes sont reconstruits après la fusion. Les 54 fichiers distants non matérialisés sont conservés par référence; aucune suppression.

## Conflits résolus

Trois conflits textuels dans deux fichiers :

1. `actor-art.js` : conserver `ego-beasts-v2.png`, son catalogue six colonnes/quatre lignes et sa validation, tout en ajoutant les trois atlas entiers d'attaque.
2. `renderer.js` : réunir l'import du suivi de marche avec `egoHeight`, sans retirer les autres imports Charles/EGO.
3. `renderer.js` : la marche des ordinaires suit la distance réelle, mais l'arrivée verrouillée force toujours leur phase de contact et conserve l'opacité d'effacement. Les quatre EGO conservent leur système propre.

Les autres blocs se combinent sans conflit. L'arrivée reste verrouillée, ses foregrounds offensifs sont masqués et les statuts EGO restent présents hors effacement.

Un test croisé a révélé un défaut d'opacité : le flash d'impact des nouvelles peintures d'attaque remplaçait l'alpha hérité au lieu de le multiplier. La correction garde l'opacité de Charles à chaque couche. Le test a échoué avant la correction, puis réussi; il couvre également une opacité nulle. Les témoins ne réapparaissent pas au dernier instant.

## Préservation

- Tous les 35 assets présents dans le candidat Charles/EGO restent identiques octet pour octet; trois atlas d'attaque sont ajoutés.
- Toma garde ses 14 directions, ses virages, sa phase de marche, son canon et ses peintures. Modules, atlas et sauvegardes Toma ne sont pas remplacés.
- Les règles de simulation de Charles, des EGO, des animaux, de Péli et de Travestia sont conservées. Le nouveau suivi des pieds est visuel, transitoire et absent des sauvegardes.
- Histoire, HUD, contrôles et dialogues restent ceux de main. Audio hit préservé; snap ajouté par le lot Charles sans répétition.

## Résultats

- **1 535 tests complets réussis**, aucun échec ni test ignoré, exécution en série.
- 330 tests ciblés croisant Toma, Charles, EGO, ennemis, Travestia et leurs sauvegardes : tous réussis.
- Revue indépendante : 162 tests ciblés réussis, scènes finales inspectées, aucun défaut bloquant trouvé.
- Équivalence face au candidat Charles/EGO figé : 4 320 ticks, trois graines, neuf scènes allant jusqu'à 300 ennemis. États gameplay, événements et RNG identiques.
- Comparaison Toma à main #53 : 240 images, 14 directions couvertes, mêmes vues/phases/positions/canons calculés et même état gameplay.
- Arrivée combinée : huit témoins dont quatre EGO et trois nouvelles attaques avec impacts encore actifs. Captures 390×844 et 320×568, normal/réduit, sauvegarde/restauration exacte à six étapes, un seul snap par scène. Tous les témoins disparaissent, sans dégâts ni récompense, tandis que Toma et sa compagne restent présents.
- Export hors ligne : 38 assets recopiés sans recompression, HTML 674 820 octets, même point d'entrée et mêmes clés de sauvegarde.

## Fiches et séquences

Les fiches de mouvement détaillées sont dans [ANIMATIONS-ENNEMIS-2026-11-05.md](ANIMATIONS-ENNEMIS-2026-11-05.md). Les fiches visuelles couvrent Toma, Charles et les 20 ennemis/boss dans `proof/all-animations/` :

- `Toma-fiche-personnage.png` : quatorze directions et poses complètes.
- `ego-character-cards.png` : paon, crapaud, rat et caméléon, six étapes chacun.
- `gorillas.png` : sept variantes de gorilles.
- `orangutan-rivals.png` : orang-outan, bouc et coq.
- `animals.png` : autruche, paparazzi, orignal et poulet disco.
- `pelican.png`, `travestia.png` : marche et attaques des deux boss.
- `all-arrival-contact.png` : vol, installation, claquement et disparition autour de Charles.

Vidéos : `all-arrival.mp4`, `all-arrival-reduced.mp4`, `attacks.mp4`, `ego-sequence.mp4` et `toma-preservation.mp4`. Les JSON joints conservent les mesures de scènes et les comparaisons.

Ces preuves utilisent le vrai moteur et les vrais modules de rendu sur Canvas natif. Elles ne valident pas un navigateur, le HUD DOM, un téléphone physique ou le ressenti de joueurs. La direction anatomique de plusieurs attaques reste représentée par deux peintures trois-quarts et leur miroir; les indications au sol gardent leur rôle de direction exacte. Les gestes d'invocation de la matriarche et les poses actives des animaux historiques ne sont pas enrichis dans ce lot.

## Reproduction

- `node --test --test-concurrency=1 tests/*.test.js`
- `node scripts/inspect-all-animation-arrival.mjs <sortie> --all`
- `node scripts/inspect-enemy-attack-transitions.mjs <sortie>`
- `node scripts/inspect-ego-animation.mjs <sortie>`
- `node scripts/inspect-ordinary-character-cards.mjs <sortie>`
- `node scripts/inspect-toma-enemy-integration.mjs <sortie> <copie-main-53>`
- `node scripts/verify-crowd-equivalence.mjs <copie-charles-ego> .`
