# Toma Popescu : 10 minutes sans IA

Un jeu de survie en pixel art, en français québécois. L'IA tombe en panne et les créations de Toma prennent la ville d'assaut. Déplace-toi, développe tes pouvoirs et tiens dix minutes jusqu'à l'arrivée de Charles.

**[Jouer dans le navigateur](https://charlescstpierr.github.io/Popescu/)**

Le tir est automatique. Le monde mêle quartiers urbains, forêts et découvertes, avec des hordes, des rivaux et trois boss majeurs. Après la survie et l'épilogue de Charles, tu peux continuer à l'infini.

## Commandes

- **Téléphone ou tablette** : glisse le pouce dans la partie inférieure gauche pour te déplacer.
- **Clavier** : WASD, ZQSD ou flèches. Échap met la partie en pause. M active ou coupe le son.
- **Améliorations** : choisis une carte quand Toma monte de niveau. Les attaques ennemies sont annoncées pour pouvoir les esquiver.

Le son démarre après une interaction. Les choix de cartes, les pauses et certains dialogues suspendent le chrono. Les dix minutes désignent la durée de survie; le combat contre Charles n'a pas de limite automatique.

## Jouer hors ligne

1. [Télécharge le dépôt en ZIP](https://github.com/charlescstpierr/Popescu/archive/refs/heads/main.zip).
2. Extrais l'archive complète.
3. Ouvre `release/Toma_Popescu_JOUER.html` dans un navigateur de bureau, en gardant `release/assets/` à côté.

Ne télécharge pas seulement le HTML et ne le lance pas depuis l'aperçu du ZIP. Cette version fonctionne sans serveur ni connexion. Les [instructions hors ligne](docs/EXPORTS-HORS-LIGNE.md) détaillent les exports et les mises à jour.

## Sauvegardes

La partie, les records et les préférences restent dans le stockage local du navigateur, sans compte ni serveur de jeu. Les nouvelles parties durent dix minutes. Les anciennes sauvegardes conservent leurs vingt minutes et leur progression.

Chaque origine web possède son stockage. Le Site d'origine, GitHub Pages et le fichier hors ligne ne partagent donc pas automatiquement les sauvegardes. Pour mettre à jour la version hors ligne, garde le même navigateur, le même profil et le même chemin du HTML.

## Développement

Le jeu utilise JavaScript natif et des modules ES, sans compilation. `dist/` contient l'application servie sur GitHub Pages.

```bash
python3 -m http.server 8000 --directory dist
```

Ouvre ensuite `http://localhost:8000`. Pour ouvrir directement un fichier HTML, utilise la version de `release/`.

```bash
npm test
python3 scripts/export-offline.py
python3 scripts/export-standalone.py
```

Les tests nécessitent Node.js et Python 3. Le moteur et les exports ne nécessitent aucun paquet externe. Quatre vérifications natives sont ignorées avec une raison explicite si le paquet facultatif `@napi-rs/canvas` est absent.

L'export courant est le dossier `release/`. L'export facultatif en un seul fichier va dans `generated/standalone/`, qui n'est pas suivi dans Git. Les images ne sont pas reconstruites par les exports.

Les changements de `main` passent les tests avant la publication GitHub Pages. Seul `dist/` est déployé. L'historique, les documents, les tests et les sources artistiques restent dans le dépôt.

## Repères du code

- `dist/engine.js` possède la simulation, sans DOM.
- `dist/run-rules.js` définit la durée et le calendrier de fin de partie.
- `dist/app.js` relie les écrans, les contrôles et les sauvegardes.
- `dist/content.js` contient les textes et les améliorations.
- `dist/renderer.js` dessine le jeu sans modifier la simulation.
- `dist/audio.js` synthétise la musique et les effets.

Pour reprendre le développement, lis [le contexte actuel](docs/REPRISE.md) et [les consignes du projet](AGENTS.md). Le [plan des dix minutes](docs/plans/SURVIE-10-MINUTES.md) explique le recalibrage et la compatibilité des sauvegardes.

Les personnages et les situations sont parodiques. Les tests Canvas et DOM ne remplacent pas une vérification du toucher et des performances sur un téléphone physique.
