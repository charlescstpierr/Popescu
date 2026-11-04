# Quatre nouvelles bêtes d’ego

## Portée

Paon Paparazzi, Crapaud Alpha, Rat Huissier et Caméléon Discount rejoignent les espèces existantes. Les concepts animaux et les quatre effets ont été approuvés. Le caméléon ne copie plus une trajectoire et le crapaud ne lance plus d’haltères.

- Paon : cadre photographique annoncé autour d’une ancienne position de Toma. Seuls les bords frappent; centre et extérieur sûrs.
- Crapaud : cible fixée dès l’avertissement, saut du corps entier, chute verticale et impact local. Une seule frappe, puis récupération vulnérable à 150 % des dégâts normaux. Les obstacles peuvent annuler le saut, jamais déplacer sa cible après l’avertissement.
- Rat : trois couloirs de factures frappent successivement; intervalles sûrs entre les bandes.
- Caméléon : visible pendant son arrivée, puis couleurs du bâtiment, de l’asphalte ou de l’herbe. Il redevient visible avant un coup de langue de 140 px, annoncé 0,9 seconde. Sa langue ne suit pas une esquive.

## Apparitions et garde-fous

Les premières tentatives commencent à neuf secondes, puis toutes les six secondes. Une arrivée ne compte que lorsqu’une position entièrement visible et dégagée est trouvée. L’introduction peut être reportée pour éviter un mur, un toit, une foule ou un élément du HUD. Elle conserve au moins 120 px de distance au joueur et une marge de 24 px dans l’écran. Les nouveaux animaux remplacent des arrivées ordinaires sans ajouter de pression à la foule.

Plafonds : huit nouvelles bêtes, deux de chaque espèce, à l’intérieur du plafond total de 300 ennemis. Les attaques sont annoncées, verrouillées et n’infligent qu’un coup par cycle. Aucun contact ordinaire supplémentaire. Le charme et le Mode avion annulent les attaques; l’activation du Mode avion est traitée avant les frappes de la même frame. Les projectiles visent le corps du crapaud en l’air et non son ombre.

La sauvegarde v15 conserve les parties antérieures, notamment le curseur des dialogues en pause v14. Les anciennes versions ne peuvent pas prétendre contenir un nouvel animal sans ses données. Tous les champs et les plafonds des nouveaux états sont validés. Le rendu reste sans mutation de la simulation.

## Vérification finale

Les tests ciblés couvrent les quatre apparitions réelles, les petites fenêtres et le HUD, les caps, chaque phase et sa reprise déterministe, les interruptions immédiates, les dégâts mortels attribués à l’espèce et les sauvegardes historiques.

Une simulation intégrée de vingt minutes a exercé les seize combinaisons espèce/phase. Maximum observé : 300 ennemis, huit nouvelles bêtes, 90 nuages, 85 particules; vingt reprises validées; plus grosse sauvegarde : 195 577 octets. Le 95e percentile des échantillons de mise à jour JavaScript était de 4,41 ms sur le calculateur de test. Cette mesure ne concerne ni le rendu ni un téléphone physique.

La suite complète finale compte 1 258 tests réussis, aucun échec. Une revue indépendante a inspecté les vrais rendus 320 × 844 et 390 × 844, en effets normaux et réduits, puis une séquence simulée du saut. La géométrie et le point de chute correspondent.

Le HTML autonome régénéré (27 419 900 octets) a passé la vérification de démarrage, décodage de toutes les images, jeu, dialogues, sauvegardes, pause/reprise, phases des quatre nouvelles espèces et absence de mutation par le rendu. Cette vérification utilise un adaptateur DOM et Canvas natif : aucun essai sur navigateur mobile ou téléphone physique n’est revendiqué.
