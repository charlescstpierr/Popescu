# Claque entière de l’orang-outan

## Livrable

- `dist/assets/orangutan-slap-v1.png` : 640 × 256 RGBA, quatre colonnes de 160 × 128 et deux rangées. Rangée 0 : face trois-quarts droite. Rangée 1 : dos trois-quarts droite. Le miroir horizontal fournit la gauche.
- Colonnes : préparation, impact/extension, fin de frappe, récupération.
- Ancre locale `[64,121]`, taille logique originale 128, échelle du jeu `83 / 128`. Dessiner à `[-64*s,-121*s,160*s,128*s]` autour du même point que la marche. Ne pas recentrer sur le milieu de la cellule de160 : les32 pixels supplémentaires servent à l’extension à droite.
- `atlas-metadata.json` contient rectangles source, ancrages, échelle et SHA256.

L’outil officiel intégré image_gen a produit le premier PNG puis une correction ciblée de la continuité du bras frappeur. Les deux sources sont conservées avec les prompts exacts. La v2 est la source retenue. Le personnage et son vêtement sont conservés visuellement, pas pixel pour pixel : fourrure rousse, bras longs, soutien-gorge et nœud roses, boucles dorées. La première passe inversait le bras frappeur dans deux cellules ; la correction remet le bras proche dans toute la séquence.

## Enregistrement reproductible

Avec la dépendance de QA du projet `@napi-rs/canvas@0.1.100` disponible :

    node art/source/orangutan-slap/register-atlas.mjs

Le script ne découpe aucun membre. Il prélève chaque peinture complète, utilise une seule échelle uniforme pour les huit images et une translation enregistrée sur le milieu de la paire de pieds. Aucune rotation, aucun cisaillement, aucune déformation. Les rectangles source ont des séparateurs dans les marges réelles plutôt que de couper la main étendue à la frontière théorique d’une cellule.

Il produit aussi deux contacts Canvas natifs : `qa/orangutan-slap-83px-1x.png`, taille de jeu83 ; `qa/orangutan-slap-83px-2x.png`, grossissement exact2× du premier. Le trait horizontal indique le sol, pas un élément du sprite.

## Sélection sans changement de simulation

Conserver les compteurs et collisions existants. Pendant `windup > 0`, afficher la colonne0 durant les0,6s. Pendant `swipe > 0`, calculer `elapsed = 0.28 - clamp(swipe, 0, 0.28)` : colonne1 jusqu’à0,10s, colonne2 jusqu’à0,20s, colonne3 jusqu’à0,28s. Ensuite reprendre la marche. Aucun nouveau compteur, pas de changement des sauvegardes. La direction de l’attaque vient de `swipeDirX/Y` si disponible, puis `faceX/Y` ; dos si Y < -0,45, miroir si X < -0,1, comme les conventions existantes.

Supprimer le bras procédural dans `_orangutanAttack` pour éviter tout troisième membre. Conserver l’avertissement au sol et éventuellement les étincelles existantes ; ne pas laisser le tremblement vertical de préparation décaler les pieds. Le secteur de dégâts reste une indication au sol : la peinture ne prétend pas dessiner une main au point exact de toutes les orientations diagonales. Seule une image entière est affichée à chaque étape, y compris le flash de dommage si présent.

## Contrôles réalisés

- Huit cellules non vides avec contours transparents ;64,4769 % des pixels de l’atlas ont alpha0.
- Bas des huit silhouettes à alpha>32 : ligne120, cohérente avec l’ancre121. Aucun pixel à alpha>32 sur le bord d’une cellule.
- Inspection du fichier source et du contact Canvas83px2× : deux bras, deux jambes, pieds visibles, soutien-gorge/nœud conservés et bras frappeur continu.
- Source et atlas hachés ; reconstruction déterministe vérifiée.
- Aucun changement du moteur, collisions, compteurs, sauvegardes, fichiers actifs d’une autre copie ou publication. Aucune suite npm test globale exécutée.
- Revue indépendante du rendu intégré encore à faire par l’intégrateur. Les contacts ne prouvent pas à eux seuls la sélection dans le jeu.
