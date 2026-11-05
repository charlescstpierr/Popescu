# Arrivée de Charles en vol et claquement

Ce rapport conserve les vérifications du candidat initial. La combinaison et ses bases ultérieures sont documentées dans [QA-CHARLES-EGO-INTEGRATION-2026-11-05.md](QA-CHARLES-EGO-INTEGRATION-2026-11-05.md).

## Portée et base

Candidat isolé sur le main vérifié `ee3e054f9260df5e711f28bb8806aea1501178d8`. Le correctif de priorité audio #48, l'histoire et les nouvelles poses de Toma avancent séparément. La combinaison sur leur head final doit être refaite et testée avant publication. Les changements de lisibilité générale et de transparence des bâtiments, retenus pour coût potentiel, ne sont pas inclus.

Charles traverse visiblement l'écran en volant, se redresse, prépare sa main puis claque des doigts. Les ennemis encore présents s'effacent ensemble après le geste. Toma et la compagne restent visibles. Les huit répliques, attaques esquivables et transformation existantes sont conservées.

## Chronologie

L'introduction reste de huit secondes de simulation. Son ancien compteur sauvegardé `phaseTime` est l'unique horloge :

- 0–2,6 s : translation du corps entier en vol, cape peinte inclinée.
- 2,6–2,95 s : stabilisation; compensation du décalage peint du visage au redressement.
- 2,95–3,45 s : doigts prêts.
- 3,45 s : main ouverte, claquement sonore sec et petit éclat centré sur la main.
- 3,45–4,05 s : disparition progressive des ennemis, sans morts comptabilisées, XP, monnaie ou butin.
- 4,5 s : retour des contrôles et ouverture possible du premier dialogue.
- 8 s : fin de l'introduction, puis combat existant.

Les ennemis conservés sont des témoins inoffensifs pendant cette courte séquence. Projectiles et dangers ordinaires sont retirés dès l'entrée. Les attaques du joueur, de la compagne et des trophées sont suspendues; les bonus temporaires continuent d'expirer. Une sortie volontaire pendant l'arrivée vide les témoins avant le retour à la victoire. Un ancien dialogue déjà actif reste récupérable.

## Art et bornes

Le nouvel atlas `dist/assets/charles-arrival-v1.png` contient trois peintures complètes dans des cellules 176×176, ancre [88,160]. Taille PNG : 62 650 octets; surface RGBA décodée : 371 712 octets. Source, prompts, coordonnées et script de registration reproductible figurent sous `art/source/charles-arrival/`.

Les 32 assets préexistants sont identiques octet par octet. Aucune rotation/déformation ni assemblage de membres. En cas d'échec de chargement du nouvel atlas, le corps entier approuvé reste visible. Aucun nouveau canvas par image, lecture de pixels, filtre ou tableau de particules dans le rendu de production. Un seul atlas supplémentaire est chargé, trois cellules; les plafonds de caches et de 300 ennemis restent inchangés. L'effacement utilise l'alpha hérité des corps et de leurs ombres.

Le vol et l'indication locale du geste restent visibles en effets réduits. Il n'y a ni flash global, ni secousse, ni scintillement ajouté.

## Vérifications

- Tests de régression écrits avant le moteur : maintien des témoins, absence de dégâts/récompenses, ordre du dialogue, son unique, pause/reprise exacte à cinq points et sortie anticipée.
- Tests de rendu : ordre au-dessus du décor pendant le vol, alpha réservé aux ennemis, avertissements inactifs masqués, geste au point peint de la main, alignement du visage, intégrité des corps et chargement de secours.
- Sauvegarde v15 conservée, sans nouveau champ persistant ni migration; JSON restauré identique aux points de contrôle.
- Suite complète initiale : 1 444/1 444 verts, aucun ignoré. Une régression sonore additionnelle vérifie ensuite le claquement, son plafond de trois voix, son intervalle minimal et le respect du silence/pause.
- Revue indépendante : le caméléon déjà en attaque conservait ses traits/langue figés. Ce détail est corrigé uniquement pendant le verrou d’arrivée; test rouge puis vert, 152/152 tests ciblés Charles/EGO passent, avec maintien des indices ordinaires après l’arrivée.
- Deux exports régénérés; dossier hors ligne : 33 assets. Les 46 modules n'ont pas de cycle; ordre des dépendances du bundler vérifié, notamment content→speech et upgrade-draft→engine.

Reproduction des captures et séquences :

`node scripts/inspect-charles-arrival.mjs /tmp/charles-arrival`

Ce script utilise le vrai Game et Renderer avec une victoire synthétique, à 390×844 et 320×568, en rendu normal et réduit. Il produit six images de contrôle, des planches et 144 images à 24Hz par variante 390×844. Il ne touche à aucun stockage de navigateur ni à aucune sauvegarde utilisateur. Les planches chargent des snapshots PNG indépendants pour éviter l'alias différé des surfaces Canvas natives.

## Limites

Captures et vidéos sont du Canvas natif réel, pas du navigateur, du HUD DOM, d'un écran tactile ou d'un téléphone physique. Les tests de cadrage vérifient la limite du HUD, mais la nouvelle séquence n'a pas encore été essayée en navigateur réel. La vidéo est silencieuse; le son est contrôlé séparément par les tests de synthèse. Aucun jugement de fluidité mobile ne découle de ces preuves.

## Mesures natives provisoires

Protocole : processus frais, ordre AB/BA alterné, quatre paires par cellule, 24 images de chauffe puis 96 mesurées, 390×844 DPR1. Lecture d'un pixel incluse pour demander la rasterisation. Machine partagée; ces mesures ne comprennent ni DOM ni entrées tactiles. Médiane des quatre médianes / médiane des quatre p95, en millisecondes :

- Survie, 81 ennemis, normal : 13,01 / 16,56 → 12,73 / 15,69.
- Survie, 81 ennemis, réduit : 12,55 / 15,30 → 12,52 / 14,60.
- Charles après l'arrivée, normal : 6,30 / 7,47 → 6,32 / 7,28.
- Charles après l'arrivée, réduit : 6,51 / 19,19 → 6,95 / 17,29. Les médianes candidates vont de 5,85 à 10,60 ms, ce qui interdit de traiter +6,8 % comme un effet établi.

Deux exécutions ont été interrompues par SIGKILL; la cause n'est pas établie. Le premier protocole sans lecture de pixels a été écarté. Le second a terminé les cellules ci-dessus mais pas la cellule arrivée. Aucune conclusion favorable sur le coût de l'arrivée n'en découle. La base retire immédiatement tous les ennemis, tandis que la nouvelle scène en garde jusqu'à 300 pendant quatre secondes : leur coût transitoire doit être mesuré séparément d'une scène de survie équivalente.

### Reprise courte, sans nouvel arrêt

Après l'arrêt des bancs longs, des processus courts et séquentiels ont terminé avec lecture RGBA complète. Deux paires AB/BA, 4 images de chauffe + 24 mesurées :

- Arrivée réelle, ancien écran vide contre 81 témoins conservés : normal 7,72 / 10,56 → 14,29 / 17,86 ms; réduit 5,90 / 7,03 → 12,67 / 16,25 ms. Le coût nouveau vient en grande partie des ennemis qui restent visibles au lieu d'être effacés immédiatement.
- Diagnostic à 81 témoins identiques dans les deux renderers : normal 13,81 / 16,67 → 12,91 / 14,88 ms; réduit 12,08 / 13,85 → 12,36 / 15,14 ms. Ce diagnostic réintroduit les témoins dans l'ancienne scène uniquement pour comparer le dessin; ce n'est pas son comportement de jeu d'origine.
- Plafond extrême de 300 témoins dans le champ, une seule paire, 2 images de chauffe + 8 mesurées : médiane normale 36,75 → 37,95 ms, réduite 33,71 → 36,87 ms; maxima 39,06 → 44,83 et 36,38 → 42,15 ms. Avec huit images, un « p95 » n'est que le maximum observé, pas une estimation robuste.

Ces petits échantillons terminés ne résolvent pas la cause des SIGKILL antérieurs. Ils montrent que conserver une foule pendant quatre secondes a un coût transitoire, et que le plafond de 300 acteurs est lourd dans les deux versions. Les variations de quelques pourcents à foule identique ne sont pas une preuve d'amélioration ou de régression stable. Aucune promesse de 60 FPS ou de fluidité mobile.

Le script livré `scripts/benchmark-charles-arrival.mjs` reproduit ces scènes courtes : `arrival`, `matched` et `cap`, ainsi que `survival`/`after`. Le lancer seul, dans un processus frais, puis alterner les versions. Il n'est pas le script de 96 images ayant produit les premiers chiffres. Aucun résultat physique mobile n'est revendiqué.

## Revue indépendante du candidat

Verdict favorable sur le code, la sauvegarde, les exports et le rendu natif examiné, sans défaut bloquant démontré. La revue a relancé 1 444 tests complets avant les deux dernières régressions, puis 18/18 tests rendu+audio sur le correctif final. Elle a reconstruit les exports dans un dossier séparé et retrouvé les mêmes octets. Les images adjacentes aux transitions ont aussi été examinées aux deux formats, en normal et réduit.

Ce verdict ne vaut pas validation de performance de l'arrivée avec une foule, ni validation de la combinaison future. La cause des interruptions SIGKILL n'est pas établie; elles ne prouvent pas à elles seules une fuite mémoire.

## Intégration à réaliser sur le head final

Appliquer uniquement le diff source ciblé, puis reconstruire les exports et le manifeste. Ne pas remplacer les fichiers entiers du head courant. Sur `dist/audio.js`, conserver `hit` parmi les sons prioritaires de #48 et ajouter `snap`; conserver les protections de priorité et de sélection des voix apportées par #48. Préserver les changements histoire/EGO et Toma dans leurs modules.

Le manifeste local vérifie 440 fichiers matérialisés et conserve sans changement 54 entrées distantes non matérialisées. Une nouvelle vérification des empreintes, des exports, de la suite complète et des conflits est requise après combinaison. Aucun déploiement ni publication n'a été réalisé.
