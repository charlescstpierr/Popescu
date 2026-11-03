# Orangs-outans : soutiens-gorge roses

La référence approuvée ajoute un soutien-gorge rose aux orangs-outans roux. Les quatre phases de face portent les bonnets, les bretelles et la bande. Les quatre phases de dos montrent les bretelles et la bande avec un petit fermoir. Les miroirs viennent du rendu existant.

L'édition utilise le véritable atlas original comme cible et le mockup approuvé comme référence de vêtement. `poses-transparent-source.png` est le résultat transparent de l'outil de génération d'images intégré; le prompt exact est conservé à côté. Le résultat n'est pas une conservation pixel par pixel de l'ancienne peinture. La silhouette, les poses et les proportions ont été contrôlées après réduction.

`register-atlas.mjs` effectue seulement des découpes de cellules, une mise à l'échelle uniforme par pose et une translation. Les hauteurs originales de chaque pose et la ligne de sol à 121 px restent enregistrées. Aucune rotation du corps ni assemblage de membres.

Le fichier de jeu reste `dist/assets/orangutan-walk-v3.png`, 512 × 256 px, huit cellules de 128 px. Le nom stable évite toute modification du rendu, de l'exporteur et de leurs consommateurs. Tous les autres atlas, dont celui des gorilles, restent inchangés. Aucun dessin ou calcul supplémentaire n'est ajouté à la boucle de rendu.

Vérification :

```sh
node art/source/orangutan-bra/register-atlas.mjs
node --test tests/orangutan-art.test.js
node scripts/inspect-orangutan.mjs /tmp/toma-orangutan-qa
```

La préparation et l'inspection utilisent la dépendance de QA existante `@napi-rs/canvas@0.1.100`. Les tests PNG utilisent uniquement Node. Le test des pixels roses échoue avec l'ancien atlas et passe avec le nouveau. L'inspection couvre les seize combinaisons de phase, face/dos et miroir, ainsi qu'une scène réelle de 390 × 844 px.
