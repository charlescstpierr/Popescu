# Accessoires de gorilles approuvés, 6 novembre 2026

## Portée

Intégration de la maquette approuvée : cœur brisé rose devant et au dos de la jalouse, cartouche verte devant et au dos du gaz, bandeau cyan avec lien du sprinter, épaulières dorées fixées aux épaules du tank. Les corps entiers et leurs quatre pas restent inchangés. Les variantes normale, explosive et matriarche gardent leur rendu existant.

`gorilla-accessories.js` applique les repères approuvés dans les cellules mises en cache par `ActorArt`, avant le flash de dégâts. Il ne change ni moteur, ni hitboxes, ni mouvement, ni sauvegarde. Aucun atlas, dessin de Toma ou contrôleur d'application n'est modifié.

## Vérification reproductible

- Sept tests couvrent les 32 poses face/dos, le cœur dorsal distinct, le flash complet, le cache et le rendu immuable dans les orientations miroir et en effets réduits.
- Les 32 empreintes de référence ont été produites depuis le code original de la maquette, puis régénérées indépendamment lors de la revue : correspondance exacte.
- Suite complète sérielle : **1 675 réussis, 0 échec, 0 ignoré** (`node --test --test-concurrency=1 tests/*.test.js`). Deux suites complètes parallèles avaient d'abord provoqué des terminaisons de processus offline sans code de sortie. Les tests d'export et les trois fumées graphiques isolés, puis la suite sérielle, ont tous réussi. La cause de ces terminaisons n'a pas été établie.
- Export hors ligne reproductible, manifeste et copies d'assets vérifiés. Le nouvel ordre de modules est testé aussi dans l'export monofichier.
- `scripts/inspect-gorilla-accessories.mjs` exécute les vrais `Game.update` et `Renderer.render` à 320 et 390 px, effets standard et réduits. Chaque séquence dure 90 images à 30 Hz, avec 48 ennemis, gaz et avertissement explosif. Les quatre phases et les deux orientations sont traversées pour chaque variante. Aucune mutation de simulation par le rendu; cache de 58 cellules sur un plafond de 144.
- Revue indépendante du code, des empreintes, de la planche et d'images réparties dans les quatre séquences : aucun défaut bloquant. La cartouche reste cohérente au retournement, les épaulières suivent la pose, le cœur dorsal est visible et le bandeau se distingue sans traînée.

- Après reprise exacte du correctif nouvelle partie déjà fusionné (#73, `96826bb`), export combiné régénéré et suite complète sérielle : **1 690 réussis, 0 échec, 0 ignoré**. Le contrôleur de #73 est conservé octet pour octet.

## Preuves

- [Planche des 32 poses, à l'échelle du jeu](../proof/gorilla-accessories/contact.png)
- [Combat 320 px, effets réduits](../proof/gorilla-accessories/combat-320-reduced.png)
- [Séquence 320 px, effets réduits](../proof/gorilla-accessories/combat-320-reduced.mp4)
- [Combat 390 px, effets standard](../proof/gorilla-accessories/combat-390-standard.png)
- [Résultats structurés](../proof/gorilla-accessories/results.json)

Pour recréer toutes les images :

```bash
node scripts/inspect-gorilla-accessories.mjs /tmp/popescu-gorilla-accessories
node --test --test-concurrency=1 tests/*.test.js
python3 scripts/export-offline.py
```

## Limites

Vérification par Canvas natif, pas par navigateur réel ni téléphone physique. Les dimensions mobiles ne prouvent pas les performances ou les commandes tactiles d'un téléphone. La foule et les décors peuvent naturellement masquer un accessoire. Le bandeau est volontairement petit, conformément à la maquette approuvée. Les séquences de combat utilisent un scénario contrôlé avec collisions désactivées, santé augmentée et événements différés pour maintenir les variantes à l'écran; ce n'est pas une mesure de difficulté ni de performance.
