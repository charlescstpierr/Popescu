# Charles : vol d'arrivée et claquement

Ce complément conserve les cinq peintures de `dist/assets/charles-whole-v1.png` inchangées. Il ajoute trois corps entiers dans un atlas séparé.

## Fichiers

- `poses-transparent-source.png` : source RGBA finale 2172 × 724.
- `register-atlas.mjs` : recadrage des trois cellules source, échelle uniforme 0,185 et translation seulement.
- `atlas-metadata.json` : ancres, iris, points du geste, SHA-256 et contrôles alpha; chemins relatifs au dépôt.
- `native-pose-review.png` : sprites à taille native, comparaison avec deux poses approuvées, agrandissement 2× sur fonds clair et sombre. Ce n'est pas une capture de partie.
- `imagegen-prompt.txt`, `imagegen-refinement-prompt.txt`, `imagegen-snap-refinement-prompt.txt` : prompts complets de génération puis de simplification à trois poses et d'ouverture de la main finale.
- `../../../dist/assets/charles-arrival-v1.png` : atlas runtime 528 × 176.

Les sources intermédiaires ne font pas partie de ce dossier.

## Registration reproductible

Depuis la racine du dépôt, avec `@napi-rs/canvas` installé :

```bash
node art/source/charles-arrival/register-atlas.mjs
```

Le script déduit la racine du dépôt par `../../..`, sans dépendre du répertoire courant ni d'un chemin local de développement. Il lit l'atlas approuvé pour la planche de comparaison, mais ne l'écrit jamais. Il produit l'atlas runtime, les métadonnées et la preuve native.

Trois cellules 176 × 176, ancre commune des pieds [88,160]. Corps d'environ 122 px du sommet des cheveux au bas des bottes. Le halo reste dans la cellule. Toutes les bordures sont entièrement alpha 0. Aucun membre n'est détaché, assemblé, tourné ou déformé.

Ordre : 0 = vol vers la droite; 1 = préparation du claquement; 2 = main ouverte après le claquement.

SHA-256 attendu du nouvel atlas :
`fbe869c879dfcada5ce5e1a4637387ba323a7172e1295fca7ddb957402d3f706`.

SHA-256 de l'atlas approuvé préservé :
`58d4f2a0e3eb1e12289f767949099721a5874b2464386c57331bd4f7c7ba4583`.

## Points d'intégration

Coordonnées locales à une cellule :
- Préparation : point du claquement [66.725,53.81].
- Après claquement : point [66.725,54.365].
- Vol : pas de point de claquement.
- Iris : voir `frames[].eyes` dans les métadonnées.

Pour le petit effet local, soustraire l'ancre [88,160] et ajouter la position exacte utilisée pour dessiner le corps, après la hauteur de lévitation. La position au sol seule ne suffit pas. Le cyan de la preuve identifie ce point; il n'existe pas dans l'atlas. Aucun effet ni glint artificiel n'est ajouté aux images par le script.

Le changement préparation → main ouverte est lisible en taille native, mais reste un petit geste. Le timing et un éclat local discret peuvent renforcer le claquement sans masquer le personnage.

La tête de la pose de vol est décalée vers la droite par rapport aux pieds. Vérifier la stabilisation lors du passage à la pose droite, avec le déplacement du corps entier, sans déformer la peinture.

Cette planche ne valide ni l'animation intégrée, ni la caméra/HUD, ni les collisions/sauvegardes, ni les performances navigateur ou téléphone. Une revue visuelle indépendante du rendu animé intégré reste nécessaire.
