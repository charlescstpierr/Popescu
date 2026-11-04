# Décor: écart entre la maquette et la version 26

Vérification du 4 novembre 2026. La version 26 est déclarée déployée par Sites à 03:14 UTC, source `edc5a3583889462d73f45ea9ab2d46fbdbe1e86d`. Les 67 fichiers d'exécution locaux sont identiques au contenu de `main` `da6a6ea8d519977d79cd3107ad6e1c04859476da` et à l'archive locale publiée. L'accès navigateur s'arrête à la connexion ChatGPT. Les rendus joints proviennent des vrais modules du jeu sur Canvas natif, pas du navigateur de production.

## Écarts constatés avant correction

- Le départ est `(0,0)`, au milieu d'un carrefour large. Les grands bâtiments sont centrés vers `(312,276)` dans chaque secteur de 512 px. À largeur 390 px, une grande partie des façades est hors champ. Le quartier ressemble donc encore au décor antérieur.
- Les familles garage, commerce, entrepôt, appartement et ruine existent déjà, mais les condos ne sont dessinés que pour les grands appartements de variante impaire. Sur 4 805 secteurs et cinq graines: 4 917 bâtiments, 264 condos (5,37 %).
- Les forêts occupent 36,67 % de l'échantillon. Le bloc `(0,0)` reste urbain; la forêt est garantie à l'est à partir de `x=1024`, soit 7,1 secondes de déplacement théorique sans arrêt à la vitesse initiale.
- La rivière se répète tous les 4 096 px et a une déviation latérale maximale de 12 px. Les ponts sont des rectangles dallés. La maquette montre des courbes, des rochers de taille variée et un pont avec profondeur, arche et balustrades.
- Le terrain, les placements et de nombreux objets de rue sont inchangés. Les nouveaux arbres et condos sont réels, mais la composition n'est pas celle de la maquette.
- Une sauvegarde conserve la graine et la position, pas des images de décor. La reprise reconstruit le monde avec le code courant. Un ancien onglet peut garder du code en mémoire, mais cela n'a pas été observé chez l'utilisateur et ne constitue pas le diagnostic.

## Correction préparée dans une copie isolée

Respecter la direction visuelle déjà approuvée: ville lisible de bâtiments variés, forêt mixte, petite rivière rocheuse et pont. Préserver la géométrie des collisions et les sauvegardes existantes. Enrichir directement les façades et le mobilier, différencier davantage les silhouettes et rendre les variations visibles dans le cadre initial. Améliorer la rivière dans son corridor franchissable existant et donner aux ponts une profondeur visible. Toute différence substantielle avec la maquette doit être présentée avant publication.

Ni modification de difficulté, ni changement des personnages, ni publication autonome. Comparaison avant/après des mêmes positions, tests de compatibilité des zones, sauvegarde/reprise, cheminement, caches et mesures Canvas natives. Ces mesures ne prouvent pas les performances sur téléphone.

## Validation finale sur la sauvegarde v13

La correction a été réintégrée sur `e618a42d9022c81f8155b8ca876883dee7d9f29e`. Le module `run-save.js`, le moteur, le monde et Charles restent identiques à cette base. Seules les nouvelles parties lancées depuis l’interface démarrent en `(256,512)`; les reprises conservent exactement leurs coordonnées. Les graines et obstacles ne changent pas.

- Suite complète: 887 tests réussis, aucun échec.
- 1 000 graines de nouvelles parties: départ et compagne sans collision, graine et directeur de boss préservés.
- Export autonome régénéré et exécuté: démarrage, sauvegarde/reprise, découvertes, phases des boss et épilogue Charles réussis.
- Captures réelles Canvas à 320 et 390 px: trois graines au départ; rue, condo et pont avec quatre menaces au plus. Rendu sans mutation et caches bornés.
- Revue indépendante: aucune nouvelle occultation bloquante; le conifère du pont masque une partie de l’extrémité droite d’un avertissement circulaire. Les bords du cadre étroit coupent certaines extrémités. Les phases actives de cette inspection sont mises en scène sans progression temporelle.

Ces preuves restent des rendus Canvas natifs, sans validation du navigateur de production, du HUD tactile ni d’un téléphone physique. La variété des façades, le pont et le cadrage initial sont améliorés, mais la densité du quartier, les routes larges et les petites pierres régulières diffèrent encore de la maquette. Aucune parité exacte avec la maquette ni aucune publication n’est affirmée.
