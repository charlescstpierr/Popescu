# Proposition : trophées des boss

Statut : direction visuelle approuvée, spécification implémentée localement le 3 novembre 2026. Voir QA-BOSS-TROPHIES.md pour les résultats et limites de vérification.

## Intention

Distinguer les trois boss par un vrai choix de style de jeu, avec des récompenses lisibles et une satire de Toma qui s’attribue tous les mérites. La victoire reste la survie à 20:00, même si un boss est vivant. L’infini demeure optionnel.

## Déclenchement et limites

- Le coffre d’un boss porte son type et sa provenance. Le premier coffre admissible de chaque type ouvre deux cartes au ramassage. Un seul choix par espèce de boss et par partie, donc trois trophées maximum. Aucun rang, aucun cumul lors des retours du même boss, aucun nouveau tirage aléatoire.
- Conserver les récompenses existantes : la défaite donne 22 XP, 3 gemmes et 25 PV de soin sous forme d’objets, ainsi que le coffre. Le coffre conserve ses 5 pièces, 18 PV, jusqu’à 12 bouclier dans le plafond existant, et 10 + floor(niveau × 0,5) XP. Le trophée s’ajoute à ce coffre, sans double crédit.
- Un coffre ordinaire n’offre jamais de trophée. Les coffres des boss déjà récompensés restent ordinaires. Le sceau disparaît dès que ce type ne peut plus offrir de choix.
- Le choix met toute la simulation en pause. Un clic/toucher sur une carte suffit. Les commandes de déplacement sont remises à zéro. La reprise garde la protection normale de 0,6 s des écrans d’amélioration, sans autre invincibilité.
- Ne jamais remplacer silencieusement un écran de niveau par un choix de trophée. Stocker un choix en attente, terminer le niveau déjà ouvert, puis proposer le trophée. Les écrans de défaite/victoire ont priorité. Si le seuil de 20:00 est atteint dans la même sous-étape, afficher la victoire; le trophée en attente peut être repris en infini.
- Sauvegarder le choix en attente, les trophées choisis, leurs délais et le coffre crédité. Une sauvegarde/reprise ne retire pas de hasard, ne permet pas de choisir les deux cartes et ne redonne pas le butin. Les anciennes sauvegardes commencent sans trophée.

## Les six options

### Péli Zodiaque

**Tarot flatteur** : toutes les 8 s lorsqu’une cible existe à portée, lancer une seule carte vers sa position verrouillée. Trajet rectiligne de 220 px puis retour au point de lancement, durée totale 1,6 s. 18 dégâts fixes par passage. Au plus trois ennemis distincts par carte, chacun au plus une fois à l’aller et une fois au retour. Une seule carte active; le tir n’est pas multiplié par Abonnés fictifs et les dégâts ne sont pas augmentés par Muscles Photoshop. Aucun charme ni ralentissement. Le dessin de la carte doit coïncider avec sa collision; pas de suivi de Toma au retour.

**Ascendant protégé** : une protection prête absorbe jusqu’à 12 dégâts d’un coup, avant le bouclier ordinaire et après les réductions applicables. Consommée même si le coup était inférieur à 12. Recharge de 12 s de simulation après consommation; pas de cumul, pas de nouvelle fenêtre d’invincibilité. Ignore les coups déjà refusés par l’invulnérabilité ou le Mode avion. Les dégâts absorbés consomment bien la protection. L’icône étoile distingue prêt/recharge.

### Travestia

**Coup de panache** : balayage de 120° devant Toma, rayon 100 px, toutes les 10 s si une cible est présente dans cette zone. Orientation verrouillée au déclenchement. 20 dégâts fixes, une seule fois par ennemi et par balayage. Repousse de 35 px les ennemis ordinaires en respectant les murs, mais jamais un boss ni un rival. Ne désactive pas leurs attaques et ne tourne/déforme jamais Toma. Un arc de panache holographique de 0,35 s matérialise exactement le secteur, sans queue greffée au personnage.

**Sortie de star** : après un coup qui consomme effectivement PV ou bouclier ordinaire, vitesse de déplacement ×1,25 pendant 2 s; recharge de 8 s à partir du déclenchement. Pas de cumul ni de prolongation par coups successifs. S’applique à la vitesse recalculée actuelle, donc respecte les autres bonus. Aucun bond, téléportation, traversée de mur, recul subi supplémentaire, ni invincibilité. Une attaque entièrement annulée par Ascendant protégé ne déclenche pas ce bonus.

### La matriarche

**Fan-club forcé** : toutes les 18 s, charme au maximum deux gorilles ordinaires non charmées à moins de 150 px de Toma pendant 2,5 s. Espèces admissibles : normal, sprinter, gas, tank, jealous, explosive. Exclure matriarche, Péli, Travestia, les rivaux, les orangs-outans et les animaux, conformément au texte « gorilles ». Sélectionner les plus proches puis l’ID pour départager, sans tirage aléatoire. Réutiliser le charme existant : elles combattent les ennemis, leurs préparations spéciales sont interrompues, elles ne deviennent pas des invocations nouvelles. Durée fixe indépendante du rang de Charisme; dégâts de charme existants conservés. Si aucune cible admissible, garder prêt. Ne jamais allonger un charme déjà actif. Petites couronnes au-dessus des deux personnages pendant l’effet, sans masquer les avertissements.

**Badge de modération** : soustraire 2 aux dégâts des contacts ordinaires des gorilles admissibles ci-dessus, après le multiplicateur de difficulté et avant le bouclier. Minimum 1 dégât. Aucun effet sur gaz, explosions, claques d’orang-outan, charge de bouc, cri de coq ou attaques de boss, même si certaines de ces attaques utilisent actuellement la source interne `touch`. Exige donc de transmettre l’auteur/type de contact, pas un simple test `source === 'touch'`. Petit badge doré et indication « −2 » lorsque la réduction s’applique; aucune aura permanente.

## Équilibrage proposé

Les nombres sont des valeurs de départ à tester, pas un équilibrage certifié. Le tarot donne au maximum 4,5 DPS sur une cible; le balayage 2 DPS situatifs plus du recul; la protection limite à 1 dégât absorbé par seconde sur la durée, en dehors de son premier déclenchement. Le charme est local, bref et borné à deux acteurs existants. Les limites par boss empêchent une croissance infinie. Ne modifier ni les PV des boss, ni les dégâts existants, ni le calendrier pour compenser sans validation.

## Toutes les additions visuelles couvertes

1. Écran de choix portrait 390 × 844, deux grandes cartes, portrait actuel du boss, accent mauve/rose/or; partie figée.
2. Six icônes et six effets dessinés dans la maquette complète. Aucune nouvelle peinture de personnage.
3. Petit sceau au-dessus du coffre admissible, sans modifier sa zone de collecte.
4. L’icône du trophée choisi rejoint les pouvoirs acquis; compte à rebours de recharge dans le coin, aucun rang.
5. Message court « [NOM] ACQUIS » pendant 1,5 s à la reprise.
6. Effets réduits : icône fixe brève, pas de particules, traînée ou secousse. La carte dommageable et le secteur actif doivent rester lisibles même en mode réduit.

La palette, les sprites, les fonds et les bordures viennent du jeu actuel. Les nouvelles vignettes sont des dessins natifs de maquette, pas du code de jeu intégré. Les fichiers PNG individuels sont lisibles à l’échelle du téléphone; la planche complète inclut les effets et les éléments communs.

## Vérifications requises pour l’intégration

- Tests des choix admissibles, non-cumul, reprise et double clic, 20:00 avec boss vivant et trophée en attente, mode infini.
- Tests de chaque effet : plafonds, source des dégâts, intervalles en secondes de simulation, gel en pause, cibles exclues, collisions réelles conformes au dessin, absence de mutation par le rendu.
- Migration des sauvegardes, sauvegarde pendant chaque choix/effet, résultat identique après reprise, aucun double crédit de pièces/XP.
- Quatre difficultés et scénario avec trois trophées; comparer durée des combats, dégâts subis, efficacité contre horde.
- Aperçus réels à 390 × 844 et 320 × 568, textes sans collision, commande tactile et clavier, faible mouvement. La présente maquette n’est pas un test sur téléphone physique.
