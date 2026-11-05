# Charles : vol, geste et cape animés

## Changement

L'arrivée de Charles utilisait trois peintures fixes et passait directement du vol diagonal à la pose debout. Elle possède maintenant douze peintures de corps entier : trois mouvements de cape en vol, deux poses de freinage, un redressement, deux poses de lévitation, la montée de la main, la préparation, le claquement et son mouvement de retour.

Le visage suit une trajectoire continue calculée depuis les points des yeux de chaque peinture. Seule l'image complète est translatée : aucun membre séparé, aucune rotation, aucun étirement, aucun fondu de corps. Le léger affaissement au freinage reste dans l'enveloppe verticale existante. L'éclat du claquement suit le point mesuré de la main de la peinture réellement affichée.

La lévitation et les premières attaques reprennent les deux peintures de cape au repos. Les effets réduits gardent l'arrivée et le geste, mais figent cette boucle de cape au repos. Les anciennes peintures restent disponibles comme secours si le nouvel atlas ne charge pas. La transformation et les attaques utilisent leurs règles et dessins existants.

## Invariants

`engine.js`, `charles.js`, `run-save.js`, `audio.js`, `app.js` et les contrôles restent inchangés. Le claquement reste à 3,45 s, la disparition à 4,05 s, la libération des commandes à 4,5 s. Aucun nouveau drapeau ni horloge sauvegardée. Le rendu utilise le temps de simulation : pause et reprise reproduisent exactement la pose. Les ennemis disparaissent sans éliminations, monnaie ni XP supplémentaires.

L'atlas ajouté mesure 704×528, contient douze cellules RGBA 176×176 et pèse 257 168 octets. Il ajoute environ 1,42 Mio de pixels décodés. Un seul dessin de corps est envoyé au Canvas par image; aucun canvas transitoire ni cache d'animation n'est ajouté. Sources, prompts et script de préparation reproductible sont dans `art/source/charles-motion/`.

## Vérifications ciblées et visuelles

- Huit nouveaux tests couvrent séquence réelle, continuité des yeux à 60 Hz, pause/reprise, effets réduits, secours de chargement, corps entier unique, bornes de l'atlas et point du claquement.
- Les six tests comportementaux ont été vus en échec avant l'implémentation; les deux tests d'intégrité et d'intégration complètent la vérification de l'art final.
- 103 tests Charles passent.
- Revue indépendante favorable des vrais Game et Renderer sur onze secondes, aux formats 390×844 et 320×568, avec et sans effets réduits. Quatre MP4 silencieux et planches de vingt contrôles. Les 80 points de comparaison gardent exactement les mêmes phases, populations, événements sonores et caches que la base.
- Mesure géométrique avec les bornes alpha réelles de toutes les poses : tête au plus haut à y=169 sur 320×568 et y=168 sur 390×844, sous la limite du bandeau y=164; pieds au plus bas à y=332/331. L'entrée hors champ par la gauche est volontaire.
- Les exports hors ligne et monofichier ont été régénérés; les 42 assets du dossier sont des copies exactes des sources. Aucun déplacement du point d'entrée ni changement de clé de stockage.

Voir aussi [la revue indépendante](QA-CHARLES-MOTION-INDEPENDENT.md).

## Suite complète

La commande `taskset -c 0 node --test --test-concurrency=1 tests/*.test.js` termine avec **1 594 tests réussis, aucun échec et aucun test ignoré**. Elle parcourt la suite entière, y compris les exports, les sauvegardes historiques, les contrôles, les collisions, les trophées et la sécurité des captures.

Deux essais antérieurs ont subi des interruptions de processus natifs : `offline-smoke`, `scenery-art`, `standalone-output-safety`, puis `offline-export`/`offline-smoke`/`scenery-art` dans l'essai sériel sans affinité CPU. Le dernier essai limite simultanément le nombre de fichiers de tests actifs et les threads natifs via l'affinité à un cœur. Les onze tests des quatre fichiers concernés avaient aussi passé ensemble dans cette configuration. Aucun test n'a été supprimé, désactivé ou assoupli pour obtenir le résultat final.

## Comparaison de charge

Trois mesures appariées par variante, dans des processus séparés limités à un cœur, comparent la base v42 et ce candidat à 390×844 avec lecture RGBA complète. Médiane des p50 : lévitation normale 8,69 → 8,04 ms; réduite 11,08 → 6,83 ms; arrivée avec 300 ennemis 40,71 → 39,70 ms, réduite 39,42 → 38,62 ms. Les mêmes caches sont utilisés. Les variations du système empêchent d'en déduire une accélération; aucun surcoût important n'apparaît dans ces échantillons courts. La scène plafonnée reste coûteuse dans cette mesure native et ne prouve pas 60 FPS sur mobile.

Les données brutes sont dans [QA-CHARLES-MOTION-BENCHMARK.json](QA-CHARLES-MOTION-BENCHMARK.json). Une première mesure concurrente avec la suite a été écartée comme comparaison de charge, car un échantillon candidat s'est interrompu pendant 1,13 s. Elle n'a pas servi à annoncer les chiffres finaux.

## Limites

Les vidéos viennent de Canvas natif et ont été inspectées par photogrammes décodés. Elles ne constituent pas un essai tactile ou une mesure sur téléphone physique. Le navigateur cloud ne pouvait pas joindre le serveur de test local (`ERR_CONNECTION_REFUSED`); aucune validation navigateur locale n'est revendiquée. La copie publiée du Site doit être vérifiée séparément après publication autorisée.
