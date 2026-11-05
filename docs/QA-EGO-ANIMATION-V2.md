# QA des quatre créatures, 5 novembre 2026

Ce rapport conserve les vérifications du candidat initial. La combinaison et ses bases ultérieures sont documentées dans [QA-CHARLES-EGO-INTEGRATION-2026-11-05.md](QA-CHARLES-EGO-INTEGRATION-2026-11-05.md).

## Périmètre

Base vérifiée : `8db2fe06fe594cb23b8c0b70d0c74ec2dcbe602d`, arbre `cf627a474221368ee67f365369268b57fd2f6d14`. Les 426 fichiers matérialisés correspondent aux blobs distants; 54 fichiers restent non matérialisés. Le lot est isolé et non publié. Toma, Charles, l’histoire, le moteur, les contrôles et le format de sauvegarde ne sont pas modifiés.

Le nouvel atlas conserve les quatre identités et apporte 24 peintures entières : repos, deux pas opposés, anticipation, action, reprise. Le crapaud ne conserve plus une pose fixe pendant toute la marche. Les trois émissions du rat suivent les fenêtres dangereuses réelles. Langue et éclat de caméra partent des accessoires peints. Le cadre actif du paon laisse voir le décor. Dégâts, charme et vie endommagée sont rétablis sans dévoiler la barre du caméléon caché.

## Vérifications exécutées

- `npm test` : **1 473 tests réussis, 0 échec, 0 ignoré**. Les tests existants de sauvegardes, interruptions, danger et clavier/tactile simulés restent inclus.
- `node --test tests/ego-animation.test.js` : **31/31**. Poses, contacts, réception, trois émissions, miroir, cellules complètes, transparence enregistrée, ancre de langue, effets réduits, cache de dégâts borné, non-mutation. Huit cas protègent les anciennes positions des repères de gorilles, rivaux et boss.
- Les 18 premiers tests ont échoué sur la base avant implémentation. Les attentes d’ancien atlas dans deux fixtures existantes ont été actualisées, sans retrait de couverture.
- Reconditionnement du PNG et de l’enregistrement à partir de la source : résultats identiques octet par octet.
- `python3 scripts/export-offline.py` et `python3 scripts/export-standalone.py` réussis. Export courant : HTML de 653 485 octets et 33 assets. Le monofichier facultatif reste hors du dossier de publication courant.
- `git diff --check` sans erreur.

## Preuves graphiques

`scripts/inspect-ego.mjs` produit 16 vues du vrai Renderer : 320/390 px, effets complets/réduits, préparation/saut/action/reprise, ainsi que les poses et les trois surfaces de camouflage. L’état de simulation est comparé avant et après chaque rendu.

`scripts/inspect-ego-animation.mjs` produit les fiches, les huit contacts de marche, le retour des impacts/vie/charme, et 210 images à 30 échantillons/seconde. Les phases avancent via `updateEgoBeast`, pas une animation inventée pour la démonstration. La vidéo peut être créée avec :

```sh
ffmpeg -framerate 30 -i /tmp/ego-animation-qa/frames/%04d.png -c:v libx264 -pix_fmt yuv420p -movflags +faststart /tmp/ego-animation-qa/ego-motion.mp4
```

La revue indépendante a inspecté les captures et les séquences échantillonnées. Elle juge les identités cohérentes et les dangers lisibles, sans anomalie bloquante après correction des repères non-ego. Elle a aussi exécuté les 31 tests ciblés. Une extraction initiale des repères décalait ceux des autres ennemis de 11 px; ce défaut a été corrigé et couvert par les huit cas dédiés avant le gel.

## Coût et limites

Le PNG effectivement chargé passe de 1 027 672 à 1 515 523 octets, soit +487 851 octets. L’image décodée passe de 4 à 6 Mio. L’ancien atlas reste conservé dans le dépôt et le dossier hors ligne, mais n’est plus chargé par ActorArt. Aucun travail supplémentaire de simulation n’est ajouté. Les caches conservent leur plafond de 144 entrées; les teintes de dégâts sont calculées une fois par pose utilisée.

Comparaison locale native de huit créatures, dangers et repères, sans décor, Toma, ombres ou interface : trois séries de 120 images après chauffe. En effets complets, médianes observées de 1,877 à 1,998 ms pour les attaques et de 2,173 à 2,432 ms avec huit impacts forcés en permanence; p95 respectifs de 2,640 à 2,589 ms et de 2,898 à 3,013 ms. Les mesures réduites varient dans la même plage. Ces petits écarts restent bruités et ne permettent aucune promesse de FPS sur appareil.

Commande reproductible, avec le paquet Canvas natif facultatif déjà disponible :

```sh
node --expose-gc scripts/benchmark-ego-render.mjs /chemin/vers/base steady
node --expose-gc scripts/benchmark-ego-render.mjs . steady
node --expose-gc scripts/benchmark-ego-render.mjs /chemin/vers/base hit
node --expose-gc scripts/benchmark-ego-render.mjs . hit
```

Le banc réinitialise la surface native entre images, sans vider les caches d’art. Sans cette réinitialisation, la rétention native des commandes/snapshots faussait la mémoire; les premières tentatives longues avec scène complète ont été tuées sans résultat exploitable, y compris sur la base. Aucun chiffre de performance du jeu complet n’en est déduit.

Il reste à vérifier la fluidité sur navigateur/téléphone réel et une foule dense. Les six peintures ne sont pas 60 dessins uniques par seconde. La marche des ennemis utilise toujours leur horloge visuelle historique, et non le compteur de distance de Toma. Les captures ne prouvent ni les entrées tactiles natives ni une validation du Site déployé.

## Intégration

Appliquer le patch source ciblé au SHA final communiqué par le parent, puis régénérer les exports depuis cette combinaison. Ne pas remplacer `actor-art.js`, `renderer.js` ou le HTML entier par une vieille copie. Le manifeste doit garder à l’identique les 54 entrées non matérialisées. Aucune PR, fusion ou publication du Site n’est comprise dans cette livraison.
