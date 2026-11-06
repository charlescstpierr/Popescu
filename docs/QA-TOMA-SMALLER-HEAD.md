# Toma : tête réduite, intégration du 6 novembre 2026

La proportion de la maquette a été approuvée avant cette intégration. Le nouvel atlas v9 remplace les huit feuilles peintes : 96 figures entières, 104 entrées enregistrées et 14 directions avec les miroirs. Les huit phases de marche et les phases de grand écart sont couvertes. Le visage, la barbe courte, la bouche visible et les lunettes sur le crâne sont conservés.

## Construction et préservation

Sources : `art/source/toma-smaller-head/`. Préparateur : `python3 scripts/prepare-hero-smaller-head.py`. Les sources et atlas v8 restent inchangés. Chaque personnage complet est redimensionné uniformément à l’échelle corporelle v8 puis recalé sur ses jambes et ses pieds. La hauteur totale n’est pas regonflée après réduction de tête. Aucun morceau de tête ou de membre n’est assemblé pendant le jeu. Métadonnées d’ancrage, canon, gameplay, commandes et sauvegardes restent identiques.

La génération avait décalé quelques figures entières : les premiers tests ont correctement détecté un canon hors de l’arme. Le recalage final corrige ce défaut sans modifier le canon de gameplay. Les limites de régression restent inchangées : canon à 5 px maximum de la peinture opaque, centroïde du bas du corps à 3 px du v8 et pieds à 2 px du sol d’origine.

## Preuves

- Tests ajoutés d’abord sur v8 : contrat v9 rouge, puis vert sur v9.
- Tests de proximité du canon et d’alignement rouges sur la première génération, verts après recalage.
- Inspecteur natif : 14 directions, 432 images de déplacement et de demi-tours, 112 échantillons de marche et 112 de grand écart, aucune mutation du jeu pendant le rendu.
- Animation continue contrôlée du vrai Game et Renderer : 1 176 images, 39,2 secondes, 14 directions et huit phases de marche pour chacune, avec grand écart dans chacune.
- Même séquence exécutée dans Chrome par une interface locale de contrôle, sans appel au stockage : atlas v9 chargé, 14 directions de marche et de grand écart, huit phases chacune et aucune mutation. Aucun défaut JavaScript du jeu observé; les erreurs d’extension de collecte des métadonnées du navigateur sont distinctes.
- Revue indépendante favorable du préparateur, des grilles, des demi-tours et des images extraites; aucun cou coupé ou gonflement gênant observé. Les trois têtes E du grand écart ont fait l’objet d’une correction et d’une seconde revue.

L’ancien diagnostic `headDrop > 8` mesurait le sommet opaque, qui peut être le crâne, les lunettes ou une arme. Il ne constitue pas une mesure fiable du mouvement corporel après réduction de tête. `headDrop=6` reste descriptif. Le contrôle le remplaçant mesure toutes les directions : masse du bas du corps abaissée de 2,43 à 5,92 px, empreinte des jambes élargie de 35 à 80 px, pieds stables à ±1 px. Des tests négatifs rejettent une pose debout réutilisée, une translation artificielle ou des pieds déplacés; une modification de tête seule ne change pas la mesure.

## Reproduire

```bash
python3 scripts/prepare-hero-smaller-head.py
node --test tests/hero-head-proportions.test.js tests/hero-split-diagnostic.test.js
node scripts/inspect-hero-head-transitions.mjs /tmp/toma-smaller-head
node --test --test-concurrency=1 tests/*.test.js
python3 scripts/export-offline.py
```

## Limites

Il n’existe pas de masques anatomiques validés pour mesurer automatiquement un pourcentage exact de réduction. Le jugement de proportion et de ressemblance repose donc sur la comparaison visuelle, pas sur un faux chiffre de précision. La revue indépendante porte sur le code et les images extraites, pas sur la lecture continue de la vidéo. La séquence Chrome est contrôlée et ne prouve ni les performances ni les contrôles tactiles sur téléphone physique. Aucun téléphone physique testé.
