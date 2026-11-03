# Boss vraiment plus résistants

## Pourquoi reprendre le réglage

La première hausse de PV laissait les configurations offensives avancées éliminer les boss en 5,7 à 7,1 secondes. En parallèle, les cœurs de la compagne rendaient les boss impossibles à viser pendant de longues périodes et interrompaient presque toutes leurs attaques. Ajouter seulement des PV aurait surtout rallongé cette attente.

Ce réglage renforce les trois boss majeurs et leur permet de jouer leurs attaques existantes. Il ne change aucun dessin, rayon de dégâts, annonce, délai de préparation ou dégât d'attaque. Le Mode avion conserve son interruption défensive. Les ennemis ordinaires et les rivaux ne changent pas.

## PV et charme

Les PV de base et leur progression existante sont multipliés, pour les nouvelles apparitions seulement :

- Jusqu'à 3 minutes : ×1,8 pour la matriarche, ×2,4 pour Travestia et Péli. Le réglage précédent était ×1,35 / ×1,60.
- De 3 à 18 minutes : progression linéaire vers ×8. Le réglage précédent plafonnait à ×2.
- Après 18 minutes : le facteur supplémentaire reste à ×8. Seule l'ancienne progression du mode infini continue.

À 18 minutes, chaque boss possède donc quatre fois les PV du réglage précédent. La première matriarche reçoit une hausse plus mesurée à cause de ses renforts.

Un cœur qui charme un boss l'interrompt toujours, mais pour 0,7 à 1,2 seconde selon le rang de Charisme. Il déclenche aussi 10 secondes de résistance aux nouvelles interruptions par charme, décomptées dès ce premier impact. Pendant cette résistance, les cœurs continuent d'infliger leurs dégâts normaux. Il n'y a ni invulnérabilité du boss ni plafond artificiel des dégâts. Les attaques et la visée évitent toujours une cible actuellement charmée, mais cette fenêtre est courte. Le charme des ennemis ordinaires reste inchangé, de 2,5 à 7 secondes. La description de Charisme signale la résistance des boss aux charmes répétés.

## Mesures réelles du moteur

`node scripts/verify-boss-durability.mjs ../version-precedente` compare les deux moteurs avec les mêmes armes, projectiles, collisions, déplacements et attaques à 60 Hz. La référence utilisée ici est le commit `6f57f62`, avant ce deuxième réglage. Sans chemin de référence, le script vérifie les combats actuels mais ne prétend pas mesurer l'ancien charme.

Le contrôleur tourne autour du boss en corrigeant sa distance. La matriarche conserve ses renforts. Aucune invulnérabilité artificielle, aucun soin artificiel et aucun dégât de test ne sont utilisés dans ces combats. L'arène exclut le terrain et les vagues ambiantes. Les configurations fixes sont documentées dans `tests/helpers/boss-combat.js`; elles ne représentent pas une progression moyenne mesurée chez des joueurs.

Temps jusqu'à une vraie défaite, difficulté normale, graine 914, en secondes :

| Configuration | Matriarche avant → après | Travestia avant → après | Péli avant → après |
| --- | ---: | ---: | ---: |
| Début équilibré, 3 min | 15,9 → 21,1 | 21,8 → 32,6 | 23,6 → 36,3 |
| Offensif intermédiaire, 10 min | 9,3 → 24,1 | 7,9 → 24,8 | 10,2 → 27,6 |
| Offensif avancé, 18 min | 6,2 → 25,3 | 5,7 → 24,2 | 7,1 → 26,8 |
| Compagne et contrôle, 18 min | 52,4 → 46,7 | 63,8 → 40,1 | 59,0 → 45,8 |
| Compagne intermédiaire, 10 min | 67,3 → 45,0 | 85,6 → 45,5 | 104,4 → 50,3 |
| Deux évolutions, 18 min | 51,4 → 26,0 | 35,4 → 23,7 | 52,3 → 26,7 |
| Charme rang 5, 18 min | 89,9 → 36,9 | 81,8 → 35,7 | 90,8 → 39,8 |

Les 288 scénarios actuels, huit configurations × trois boss × quatre difficultés × trois graines, aboutissent tous à une vraie défaite du boss sans mort du joueur contrôlé. Travestia exécute sa rotation et sa charge; Péli atteint ses cartes de tarot dans chaque scénario. Les configurations offensives avancées durent 24,2 à 27,1 secondes; les configurations avec compagne et évolutions restent entre 20,7 et 51,1 secondes. Un ancien scénario avec compagne n'avait pas abouti à une défaite au plafond de 120 secondes; le rapport le signale au lieu d'inventer un ratio.

La compagne ne rallonge plus les combats en neutralisant presque tout. Dans l'exemple avancé normal, Travestia passe de 56,1 à 3,6 secondes charmée et complète deux cycles d'attaque. La durée totale baisse, mais la fenêtre où le boss peut agir augmente fortement. Ces mesures ne prouvent pas un taux de victoire humain ou une hausse universelle de difficulté pour chaque joueur.

Le cas volontairement extrême du fusil de départ sans amélioration, à 3 minutes en normal, dure 117,2 secondes pour la matriarche avec ses renforts, 60,2 pour Travestia et 67,6 pour Péli. Tous sont battus sans invulnérabilité artificielle. La matriarche peut donc rester longue si le joueur n'a pris aucune amélioration.

## Sauvegardes et limites

La version intégrée utilise la sauvegarde v8 pour conserver la direction réelle du déplacement; les sauvegardes v7 sont migrées sans perdre leurs évolutions ni leurs dépenses. `bossCharmResistance` est un champ optionnel borné entre 0 et 10 secondes, réservé aux boss. Les anciennes sauvegardes qui n'ont pas ce champ restent valides; aucune conversion de PV ni nouveau champ obligatoire n'est injecté à la reprise. Un boss déjà présent conserve exactement ses PV restants, ses PV maximum et son charme en cours. Une nouvelle résistance est sauvegardée exactement, survit aux reprises répétées et reste figée en pause. Les migrations v3/v5/v6 existantes restent couvertes par la suite générale.

La victoire reste liée à la survie à 20 minutes, même lorsqu'un boss est encore vivant. L'infini demeure optionnel. Le calendrier garde un seul boss majeur à la fois et le plafond de 300 ennemis. Le calcul de PV intervient à l'apparition; la résistance ajoute au plus un compteur actif pour le boss. Aucun nouveau parcours de la population ou effet graphique n'est ajouté.

## Vérification

- Suite complète, contrôles ciblés du charme, des attaques existantes, des anciens boss blessés, de la pause et des reprises répétées.
- 288 combats actuels comparés aux mêmes scénarios de la version précédente, plus trois cas sans amélioration : `proof/boss-hardening/comparison.json`.
- Revue indépendante : 288 scénarios supplémentaires avec les graines 1/914/99173, sans défaite du joueur; des cœurs réussissant à chaque image pendant 60 secondes permettent encore six cycles d'attaque complets à Travestia et à Péli. Les captures/reprises pendant ces attaques restent valides.
- HTML autonome régénéré et vérifié avec l'adaptateur DOM/Canvas natif.

Ces arènes et vérifications natives ne remplacent pas une partie humaine dans la horde ni un essai tactile/performance sur téléphone physique. Les contrôles du calendrier et de performance utilisent une survie contrôlée séparée; ils ne servent jamais de preuve de difficulté des combats.
