# Reprise dans une nouvelle discussion

Le projet est prêt à être continué à partir de la v1.5 approuvée le 3 novembre 2026. L'utilisateur donnera le prochain objectif. Lire aussi [AGENTS.md](../AGENTS.md) pour les contraintes qui ont évité les régressions précédentes.

## Provenance et état

- Site privé de référence: [Toma Popescu, survie sans IA](https://toma-popescu-survie-sans-ia.charlescstpierr.chatgpt.site).
- Commit de référence du Site au moment de la copie: `a19686f`.
- Destination GitHub prévue: `charlescstpierr/toma-popescu`, dépôt privé. Sa création et son premier envoi sont gérés séparément de cette copie; la présence de ce document ne confirme pas que cet envoi a eu lieu.
- Le code, les images, les sources artistiques, les tests et les scripts sont regroupés ici. La copie GitHub ne contient pas de configuration de déploiement du Site et ne lui est pas reliée automatiquement.
- [release/Toma_Popescu_JOUER.html](../release/Toma_Popescu_JOUER.html) est le point d'entrée du dossier hors ligne courant: JavaScript/CSS embarqués et images intactes dans `release/assets/`. Extraire le dossier complet puis ouvrir ce HTML sur ordinateur, sans serveur. Lire [EXPORTS-HORS-LIGNE.md](EXPORTS-HORS-LIGNE.md) pour la migration et l'export facultatif en un seul fichier.

## Jeu actuel

Toma est une caricature fictive narcissique, dépendante des images et de la validation de l'IA. Il prétend que toutes les femmes le poursuivent; le récit contredit cette prétention. Une panne mondiale rend ses créations incontrôlables. Il doit survivre 20 minutes dans une ville procédurale infinie, puis peut continuer en mode infini.

L'interface et les échanges sont en français québécois. Le jeu vise le portrait mobile de 390 × 844, avec joystick tactile, WASD, ZQSD, flèches, pause et réglages. Le tir est automatique. Records et préférences utilisent le stockage local, sans compte ni serveur de jeu.

Les sept variantes de gorilles femelles sont `normal`, `sprinter`, `gas`, `tank`, `jealous`, `explosive`, `matriarch`. Les orangs-outans femelles ont une anatomie distincte et une frappe de bras annoncée par un secteur. Les attaques au gaz préviennent avant l'émission; les nuages et explosions restent lisibles et esquivables. Les hordes mixtes commencent tôt, reviennent régulièrement et restent limitées à 300 ennemis.

Deux types de rivaux masculins arrivent en alternance, avec deux rivaux actifs maximum. Le bouc prépare un coup de tête, puis charge dans un couloir verrouillé. Le coq reste sur place, prépare son cri, lance `COCORICO!` et une onde circulaire. Seul l'anneau en expansion inflige des dégâts, une fois par cible. Charme et Mode avion peuvent interrompre ces préparations. La réplique exacte de Toma, déclenchée par le vrai cri, est `Men, farmes ta criss de gueule !`.

Pendant la course réelle, Toma fait parfois un grand écart sans interrompre les commandes ou le tir. Seize vantardises québécoises évoquent notamment Van Damme; des réponses de la compagne sont retardées pour garder les échanges lisibles. Les insultes et réponses réservées aux rivaux restent conditionnées par leur présence. Les échanges peuvent être désactivés.

Les douze améliorations demandées sont conservées sous leurs identifiants stables: `muscle`, `car`, `followers`, `ego`, `money`, `airplane`, `girlfriend`, `charisma`, `chopper`, `truth`, `filter`, `validation`. Les noms visibles sont dans `content.js`, dont Muscles Photoshop, Lamborghini imaginaire, Abonnés fictifs, Ego surdimensionné et Blonde IA. `airplane` active le Mode avion contre le gaz et les attaques proches; `chopper` fait passer une moto Harley holographique. Les options `speed`, `magnet`, `detox` complètent ces douze améliorations. Les descriptions doivent continuer à correspondre aux effets réels.

La Blonde IA suit Toma, tire des cœurs, charme, aide à ramasser et revient après avoir été mise à terre. Les gorilles jalouses peuvent la viser. En dehors de l'introduction écrite, ses interventions spontanées en partie attendent son déblocage.

La ville contient routes violettes, trottoirs, bâtiments et objets de rue variés. Les carrefours restent praticables. Les événements près des objets ne doivent pas interrompre la partie en boucle.

La musique de combat originale « Égo de guerre », choisie par l’utilisateur, comporte 32 mesures à 148 BPM. Le menu distinct conserve ses huit mesures à 104 BPM. La mélodie alterne appels et réponses, avec quatre mesures de respiration instrumentale. La progression musicale survit aux pauses; cartes et dialogues gardent la musique de combat en la baissant. Les effets synthétiques et les voix audio sont plafonnés à 32 pour préserver la mélodie. `setIntensity`, `setDucked`, `sfx('split')` et `sfx('rooster')` sont déjà reliés au jeu.

## Décision graphique v1.5 à préserver

L'utilisateur a rejeté le personnage constitué d'un torse et de jambes assemblés. Il a ensuite approuvé les grands mockups représentant chaque phase avec le corps entier. Cette dernière décision prévaut sur les anciens plans v1.3/v1.4.

Chaque dessin contient tête, torse, mains, arme et bottes. Le rendu utilise une seule image complète, sa translation et, pour les directions opposées, un miroir horizontal. La transformation reste l'identité: aucune rotation du corps, déformation affine, jambe rapportée ou main flottante. Le secours en cas de chargement raté est aussi un dessin complet.

Les cellules font 144 × 128 px, avec l'ancre `[65,111]`; l'atlas fait 1152 × 1280. Les cinq vues E, SE, S, NE et N donnent huit directions. Les 65 entrées contiennent huit pas et cinq emplacements de grand écart par vue; les préparations inutilisées peuvent être dupliquées. Les 13 images E sont identiques pixel par pixel aux images approuvées. Les autres feuilles ont une échelle uniforme réglée sur une hauteur médiane de course de 78,5 px.

`walkDistance` avance avec le déplacement réel, à raison de 10 px par phase. La pose de contact `run0` sert à l'arrêt et au retour du grand écart. L'entrée utilise les préparations larges `split2`, `split3`, puis `split4`; le maintien entre 24 % et 69 % reste strictement identique. Le corps descend avec les jambes.

La direction du corps dépend d'une cible vue depuis le torse fixe `y−40`, avec une rétention de 0,05 radian, environ 3°. Les petites variations du canon entre deux dessins ne changent pas cette direction. Les balles partent du canon mesuré de l'image active et visent exactement la cible. L'éclat suit le canon peint via `barrelAim`; il ne faut pas déformer le dessin pour le faire suivre à `aim`. Le contact très proche conserve dégâts et cadence sans produire de balle inversée.

## Architecture

| Fichier | Responsabilité |
| --- | --- |
| `dist/index.html`, `styles.css`, `app.js` | Écrans, contrôles, HUD, préférences et liaison des événements. |
| `dist/engine.js` | Simulation, ennemis, collisions, tirs, améliorations et fin de partie; aucun DOM. |
| `dist/world.js` | Ville déterministe par zones, obstacles et éviction des zones lointaines. |
| `dist/hero-frames.js` | Rectangles et points mesurés des dessins complets, plus secours encodé. |
| `dist/hero-pose.js` | Phase selon distance, grand écart, direction stable, visée et canon partagés. |
| `dist/hero-art.js` | Dessin complet de Toma et éclat de tir, sans mutation de la simulation. |
| `dist/renderer.js`, `actor-art.js` | Scène Canvas et autres personnages. |
| `dist/city-art.js`, `combat-art.js` | Décor, réactions et effets de combat. |
| `dist/content.js` | Noms, dialogues, difficulté et descriptions d'améliorations. |
| `dist/audio.js` | Composition et synthèse Web Audio, scènes, intensité, effets et limites de voix. |
| `art/source/toma/` | Six PNG source haute résolution: course E, grand écart E et quatre autres vues. |
| `scripts/prepare-hero-whole.py` | Préparation portable des images complètes et des points enregistrés. |
| `scripts/export-offline.py`, `offline_bundle.py` | Assemblage du dossier hors ligne courant depuis `dist/`. |
| `scripts/export-standalone.py` | Export facultatif en un seul fichier sous `generated/standalone/`. |
| `scripts/inspect-hero.mjs`, `inspect-graphics.mjs` | Inspection réelle avec Canvas natif et contacts d'animation. |
| `scripts/render-music-preview.mjs` | WAV d'audition utilisant les mêmes notes et instruments que le jeu. |
| `tests/` | Tests déterministes du jeu, du monde, du personnage, de l'audio et de la réaction au coq. |

Les autres scripts et anciens atlas sont conservés pour l'historique. Leur présence ne signifie pas que l'ancien assemblage de Toma est encore actif. [docs/CONTRACT.md](CONTRACT.md) décrit les interfaces générales; sa partie v1.4 doit être lue comme un historique lorsque son rendu contredit la v1.5.

Les six sources fournies sont `run-east.png`, `split-east.png`, `southeast.png`, `south.png`, `northeast.png` et `north.png`. Elles servent de références visuelles pour une future édition ou génération d'images; conserver les peintures E approuvées et le style commun.

## Lancer et vérifier

Depuis la racine du dépôt:

```bash
python3 -m http.server 8000 --directory dist
```

Ouvrir `http://localhost:8000`. Ne pas lancer `dist/index.html` directement avec `file://`, car cette version utilise des modules ES. Pour une ouverture directe, utiliser `release/Toma_Popescu_JOUER.html` avec son dossier `assets/`.

```bash
npm test
python3 scripts/export-offline.py
python3 scripts/export-standalone.py
```

La suite nécessite Node.js et Python 3 (bibliothèque standard pour les exports). Les tests du moteur et de l'export ne nécessitent aucun paquet externe; les trois tests de fumée graphiques du dossier hors ligne et le test natif de publication atomique des captures sont ignorés explicitement si `@napi-rs/canvas` n'est pas installé. Pour la QA graphique facultative, installer `@napi-rs/canvas@0.1.100` avec `npm install --no-save @napi-rs/canvas@0.1.100`, puis lancer les deux scripts d'inspection en leur donnant un dossier de sortie. La préparation artistique Python utilise les versions épinglées de Pillow, NumPy et SciPy:

```bash
python3 -m pip install -r art/requirements.txt
```

Les six sources sont fournies, aucun ancien chemin de session n'est nécessaire. Le préparateur portable a reproduit l'atlas PNG et `hero-frames.js` à l'identique, octet par octet.

## Preuves et limites

La référence v1.5 compte 80 tests réussis. Les contacts natifs couvrent 64 phases de course et 64 phases de grand écart, avec huit directions visibles, huit pas distincts, une extension fixe et un rendu qui ne modifie pas la simulation. La scène réelle fait 390 × 844; les figures mesurent 71–82 px. Le HTML autonome a aussi été exécuté avec un adaptateur DOM et Canvas natif. Les résultats détaillés sont dans [QA-V1.5.md](QA-V1.5.md).

La mesure locale de 9,6 ms par image vient de Canvas natif. Le contrôle sur navigateur mobile physique, les safe areas, le toucher et les performances iPhone/Android restent à vérifier. Les contraintes initiales de fluidité mobile, de commandes fiables et de lisibilité restent des exigences pour toute évolution; elles ne constituent pas une validation matérielle déjà réalisée.

## Au début de la prochaine discussion

Lire ce document, vérifier l'état Git et demander l'objectif de la nouvelle session s'il n'a pas été donné. Partir de la v1.5, préserver les choix approuvés et consulter les tests du composant concerné avant de le changer. Après une modification, exécuter les vérifications adaptées; régénérer le dossier `release/` si l'application change. Un déploiement ou un envoi sur un service externe doit correspondre à une demande de l'utilisateur.

L'utilisateur souhaite explicitement du travail en sous-agents pour gagner du temps. Distribuer les tâches indépendantes sans partager les mêmes fichiers en écriture. Après une modification des animations, demander une revue visuelle indépendante des véritables rendus; des tests seuls ne suffisent pas à valider les proportions, la continuité du corps et le mouvement.
