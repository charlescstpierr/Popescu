# Toma : angles et mouvement, 5 novembre 2026

## Changements isolés

La demande est de rendre les angles de Toma moins carrés et ses mouvements plus fluides, sans nouvelle approbation de maquette. L'identité, les corps entiers, les commandes et les règles du jeu sont conservés.

- Trois nouvelles feuilles de corps complets ajoutent les vues à 32°, 67° et −65°, et leurs miroirs. Quatorze directions remplacent huit directions. Le plus grand intervalle passe de 76° à 36°. Les 65 dessins v5 restent identiques pixel par pixel dans le haut du nouvel atlas.
- Une orientation commune au torse sert maintenant aux cibles proches, lointaines et à la marche libre. La perte de cible à l'arrêt conserve la dernière vue. Une hystérésis de 0,08 rad entre coûts évite le papillonnement aux frontières.
- Les virages prennent le chemin court, avec une vitesse maximale de 16 rad/s, soit moins de 197 ms pour un demi-tour. Le déplacement du joueur, le choix de cible et la cadence ne sont pas ralentis.
- Exception volontaire : au moment où un tir est dû, si la cible est derrière le canon peint, le personnage termine immédiatement ce virage avant de tirer. Un demi-tour exceptionnel au départ du tir reste préférable à une balle sortant à rebours ou à un tir retardé.
- La marche avance dans une phase continue liée à la distance réellement parcourue. Marcher à reculons inverse l'évolution de cette phase, sans transformer soudain le pas 2 en pas 6. Le grand écart garde son maintien exact.

## Images et intégration

`art/source/toma-turns/` contient les trois sources retenues et leur enregistrement. `scripts/prepare-hero-turns.py` produit `dist/assets/toma-whole-v6.png` et complète `hero-frames.js`. L'atlas v5 reste la source intacte de ses cinq vues. Aucun membre séparé, fondu entre silhouettes, rotation ou déformation du corps n'est utilisé.

Les angles demandés au générateur ne sont pas acceptés sur parole : les premières propositions trop proches des vues existantes ont été écartées. Les angles enregistrés correspondent aux armes réellement dessinées. Les ouvertures des canons frontaux sont repérées dans les sources, puis vérifiées dans le rendu natif.

## Vérifications

- Tests de régression écrits et vus échouer avant correction : frontière à 79,99/80,01 px, joystick à 6,9/7,1°, cible qui disparaît, cible opposée, inversion de marche, gel modal, sauvegarde/reprise et données invalides.
- Tests de tir : origine exacte au canon de chaque peinture, rayon vers la cible, dégâts au contact et cadence conservés, protection contre un tir à rebours pendant un demi-tour.
- Inspection native : 112 poses de marche, 112 poses de grand écart, 14 directions et 120 canons vérifiés; hauteur 71–85 px, largeur 33–65 px. Huit pas distincts, arrêt stable, maintien du grand écart identique, rendu sans mutation.
- Vidéo `proof/motion/before-after.mp4` : 8 secondes à 30 images/s, vrai moteur `Game.update` et vrai `Renderer`, avec entrée de marche et cible orbitale contrôlée. `frames.json` décrit chaque image. Ce scénario synthétique permet de comparer le mouvement; ce n'est pas un playtest humain.
- Les captures du playtest navigateur précédent ont servi à vérifier l'échelle réelle et le contexte. Le nouveau candidat n'est pas encore validé dans un navigateur ou sur téléphone physique.

## Sauvegardes et coût

La version et les clés de sauvegarde ne changent pas. Le petit état visuel optionnel `heroMotion` contient angle, phase, distance et sens; les anciennes sauvegardes n'en ont pas besoin. Les nouvelles sauvegardes le valident et le restaurent exactement. Aucun tir, événement ou tirage aléatoire supplémentaire n'est introduit.

Le nouvel atlas fait 1152 × 2048, contre 1152 × 1280, soit 3,375 Mio RGBA décodés supplémentaires. Le PNG passe d'environ 416 à 646 Kio. Le personnage coûte toujours un seul dessin d'image par rendu; aucun cache de transition croissant. Une mesure Canvas native ne certifie pas les performances tactiles ou le taux d'images d'un téléphone.

## Revue et limites

Une revue indépendante a accepté les nouvelles directions à taille réelle : corps entiers, armes solidaires, pas de fantômes ni rupture d'identité flagrante. MSE/MSW restent légèrement plus sombres, et les vues presque frontales/arrière un peu plus fines. Ces écarts modestes ne justifient pas de remplacer les peintures approuvées.

La revue temporelle indépendante a examiné 240 images et 28 224 combinaisons de tirs : origine et rayon corrects, positions identiques, variation de phase maximale de 1. La suite globale du candidat isolé initial passe 1 441 tests sans échec ni test ignoré, puis les 9 contrôles d’export ont été relancés après la dernière régénération. Aucun résultat ne constitue une note de joueurs ou une preuve de plaisir universel. Le candidat reste isolé jusqu'à son intégration coordonnée; aucune publication du Site.

## Intégration finale sur main

Le candidat final part de `3681edd08e7581dd3fb33ab76fbc9d7d47594bff`, après les corrections du clavier HUD, du signal sonore de dégâts et de l'histoire. Les 430 fichiers matérialisés ont été comparés aux empreintes Git de ce commit, sans différence. Les 54 fichiers historiques non matérialisés restent présents, avec leurs références et empreintes inchangées; ils ne sont ni supprimés ni remplacés par des fichiers vides.

Le patch source Toma s'applique sans conflit. `audio.js`, ses tests, le contrôleur `app.js`, les styles et le renderer sont identiques à la nouvelle base. Les trois modules d'histoire `content.js`, `opening.js` et `speech.js` restent également identiques octet par octet. Le dossier hors ligne et le monofichier facultatif sont reconstruits depuis le code combiné, sans recopier un ancien export.

Le premier lancement parallèle de `npm test` a réussi 1 466 tests sur 1 467. Le sous-processus natif de `offline folder standalone smoke works after moving into a path with spaces` s'est interrompu sans code de sortie; la cause exacte n'est pas établie. Les trois tests de fumée hors ligne passent isolément. La suite complète relancée avec `node --test --test-concurrency=1 tests/*.test.js` passe ensuite **1 467 tests**, sans échec ni test ignoré, en 73,5 secondes. Aucun test n'a été désactivé ou assoupli.

Un contrôle croisé supplémentaire charge une vraie sauvegarde v15 de main dans le candidat, puis une sauvegarde du candidat dans le lecteur main. Les deux passent sans changement de version. Une reprise du candidat reste déterministe pendant 120 images supplémentaires.

La vidéo comparative finale utilise exactement la nouvelle base main et le candidat avec le même scénario, la même graine et les mêmes entrées. La fiche et les planches de poses sont régénérées. La revue indépendante vérifie la conservation histoire/audio/HUD et le code Toma déjà approuvé. Les limites navigateur et téléphone restent inchangées.

### Coût mesuré sur le combiné final

Mesure supplémentaire : Canvas natif, rendu complet avec lecture RGBA, scènes figées identiques, processus frais et deux répétitions avec ordre avant/après inversé. Chaque cellule contient deux séries de 24 images mesurées après échauffement. Les valeurs sont la moyenne des médianes et la moyenne des P95 des deux séries, pas les quantiles des 48 images regroupées. La machine est partagée avec d'autres vérifications; ce n'est pas un benchmark matériel isolé.

| Scène | Mode | Moyenne des médianes avant → après | Moyenne des P95 avant → après |
| --- | --- | --- | --- |
| 16 ennemis, 6 nuages | standard | 9,37 → 12,19 ms | 11,77 → 14,30 ms |
| 16 ennemis, 6 nuages | réduit | 9,35 → 8,48 ms | 10,68 → 10,21 ms |
| 300 ennemis, 90 nuages | standard | 65,71 → 59,84 ms | 80,02 → 81,28 ms |
| 300 ennemis, 90 nuages | réduit | 42,99 → 49,71 ms | 55,18 → 57,68 ms |

Il n'y a donc pas de gain uniforme démontré. Le cas léger standard est plus lent d'environ 2,8 ms dans ce protocole; le cas dense réduit l'est d'environ 6,7 ms. Les variations entre répétitions sont importantes dans les scènes denses. Un contrôle isolé du dessin de Toma sur trois répétitions donne des médianes de 0,0071–0,0104 ms avant et 0,0080–0,0117 ms après. Le coût supplémentaire direct du héros est faible dans ce test; cela ne suffit pas à expliquer ni annuler les écarts du rendu complet.

La mémoire résidente de ces processus augmente fortement pendant les lectures de pixels dans les deux versions; ce protocole court n'est pas un test d'absence de fuite. Le delta attendu de l'image décodée reste borné à 3,375 Mio. Aucun cache de transition ni effet de fondu n'a été ajouté. La validation sur navigateur mobile reste nécessaire avant de garantir la fluidité du jeu complet.
