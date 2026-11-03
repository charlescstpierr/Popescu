# Boss plus résistants

## Réglage

Seuls les PV calculés à l'apparition des trois boss majeurs changent.

- Jusqu'à 3 minutes : PV de la matriarche ×1,35; Travestia et Péli ×1,60.
- De 3 à 18 minutes : progression linéaire vers ×2 pour chacun.
- Après 18 minutes : le multiplicateur supplémentaire reste à ×2. L'ancienne progression du mode infini continue normalement.

La matriarche reçoit une hausse initiale plus modérée, car ses renforts détournent déjà les tirs. Ses invocations, les préparations et dégâts des attaques, le charme, les armes, les difficultés, les récompenses et les ennemis ordinaires restent inchangés. Le calendrier aléatoire conserve un seul boss majeur à la fois.

Exemples de PV dans une nouvelle rencontre :

| Moment | Matriarche | Travestia | Péli |
| --- | ---: | ---: | ---: |
| 3 minutes, avant | 696,7 | 812,6 | 908,2 |
| 3 minutes, après | 940,5 | 1 300,2 | 1 453,1 |
| 18 minutes, avant | 1 623,2 | 1 475,6 | 1 649,2 |
| 18 minutes, après | 3 246,3 | 2 951,2 | 3 298,4 |

## Mesures de combat

`node scripts/verify-boss-durability.mjs` exécute les véritables armes, projectiles, collisions, déplacements et attaques du moteur à 60 Hz. Un contrôleur tourne autour du boss en corrigeant sa distance. La matriarche conserve ses renforts. Il n'y a ni invulnérabilité artificielle, ni terrain, ni vagues ambiantes. Les configurations d'améliorations sont fixées et documentées dans `tests/helpers/boss-combat.js`; ce ne sont pas des statistiques de progression moyenne des joueurs.

Temps jusqu'à une véritable défaite du boss, difficulté normale, en secondes :

| Configuration | Matriarche avant → après | Travestia avant → après | Péli avant → après |
| --- | ---: | ---: | ---: |
| Début équilibré, 3 min | 12,0 → 15,9 | 14,7 → 21,8 | 14,7 → 23,6 |
| Offensif intermédiaire, 10 min | 5,1 → 9,3 | 4,5 → 7,9 | 5,6 → 10,2 |
| Offensif avancé, 18 min | 3,0 → 6,2 | 2,8 → 5,7 | 3,6 → 7,1 |
| Compagne et contrôle, 18 min | 35,2 → 52,4 | 34,1 → 63,8 | 34,7 → 59,0 |

Les 48 scénarios (trois boss, quatre configurations, quatre difficultés) se terminent par une défaite du boss sans mort du joueur contrôlé. Cela démontre une augmentation mesurée de durée dans ces scénarios, pas une garantie de facilité ou de difficulté pour un joueur humain.

Le charme existant empêche de viser les ennemis charmés : les configurations centrées sur la compagne peuvent donc déjà être beaucoup plus lentes. Avec le réglage retenu, ces cas durent de 46,6 à 81,7 secondes dans les quatre difficultés, contre 30,0 à 53,0 secondes avant. Ce comportement n'a pas été changé implicitement.

Le contrôle extrême sans aucune amélioration à 3 minutes donne 77,6 secondes pour la matriarche avec ses renforts (50,9 avant), 40,4 pour Travestia (25,3 avant) et 45,1 pour Péli (28,7 avant). Ces combats restent possibles dans le scénario, mais la matriarche est plus longue avec le fusil de départ seul. Une première proposition de hausse ×2 à ×3 a été écartée après avoir mesuré 132 secondes pour ce cas et jusqu'à 110 secondes avec la compagne.

## Sauvegardes et limites

La version de sauvegarde reste v6. Un boss déjà présent conserve exactement ses PV restants et ses PV maximum : aucun soin, recalcul ou doublement à la reprise. Les nouvelles rencontres bénéficient du réglage. Les sauvegardes v3/v5 passent toujours par la migration existante du calendrier.

Aucune image, animation, feuille de style, logique de rendu ou limite de population ne change. Le calcul supplémentaire intervient à l'apparition, pas dans la boucle de dégâts. Les plafonds restent à 300 ennemis et un boss majeur. Le HTML autonome est régénéré.

## Vérification

- `npm test` : 396 tests réussis, dont 47 contrôles de résistance supplémentaires.
- Tests de combat réel, armes de départ, contrôle par la compagne, ennemis ordinaires, première attaque des boss, reprise d'un boss blessé, reprise répétée et progression bornée en infini.
- `node scripts/verify-boss-durability.mjs` : 48 comparaisons avant/après et trois cas sans amélioration. Résultats détaillés dans `proof/boss-durability/comparison.json`.
- `node scripts/inspect-standalone.cjs proof/boss-durability/standalone.png` : démarrage du HTML final, images embarquées, pauses, reprise, phases des boss et calendrier aléatoire réussis avec adaptateur DOM/Canvas natif.

Les scénarios contrôlés et Canvas natif ne remplacent pas une partie humaine dans la horde, un navigateur réel ou un essai tactile/performance sur téléphone physique.
- `node scripts/verify-boss-arrivals.mjs` : quatre parcours de 25 minutes, victoire à 20 minutes puis infini, 38 reprises par difficulté, 8–9 boss rencontrés et plafond de 300 ennemis respecté. Survie et défaites après 30 secondes sont contrôlées dans ce test du calendrier, distinct des mesures de combat ci-dessus.
- `node scripts/verify-crowd-equivalence.mjs ../random-boss-arrivals .` : 4 320 pas exactement identiques à PV de comparaison fixés; vérifie que le changement n'altère pas les mécaniques existantes.
- `node scripts/benchmark-crowd.mjs` : scène de 300 ennemis, cinq parcours après échauffement, empreinte finale identique. Moyenne native avant/après 1,19/1,14 ms, p95 moyen 1,61/1,69 ms. Ces petites variations ne prouvent ni gain ni régression de performance; ce n'est pas une mesure de navigateur ou téléphone.
