# XP au sol

La valeur de l'XP n'est plus supprimée après 38 secondes, à 1 800 pixels du joueur ou lorsque le champ atteint sa limite de 260 objets.

Les cristaux concernés sont réunis dans un seul cristal d'XP. Celui-ci garde sa valeur et n'expire plus. Un champ trop rempli regroupe aussi les autres cristaux dans ce paquet, puis garde au plus 259 pièces, soins ou gemmes. Ces autres objets conservent leur durée de vie habituelle.

Le paquet garde sa position tant qu'il reste à moins de 1 800 pixels de Toma. Au-delà, le jeu cherche près du joueur une position hors de la portée des aimants de Toma et de la compagne. Le trajet complet doit être libre pour un personnage de la largeur de Toma. La recherche vérifie au plus 32 directions. Si elles sont toutes bloquées, le paquet et sa valeur restent à leur ancienne position jusqu'à ce qu'un trajet se libère. Il faut encore s'en approcher et le ramasser. La création ou le déplacement de ce cristal n'ajoute aucune XP au joueur et ne déclenche aucune carte.

Le mouvement de l'aimant s'arrête à la cible au lieu de la dépasser. Cela supprime l'oscillation qui empêchait certains objets d'être ramassés avec une grande portée à 30 Hz.

## Sauvegardes

Le champ facultatif `compact: true` identifie le cristal regroupé. Les anciennes sauvegardes sans ce champ restent valides. Une capture de partie applique le regroupement à sa copie avant les limites de tableau, y compris à la mort ou à la victoire. Elle ne modifie pas la simulation en cours. Le paquet garde sa valeur après plusieurs sauvegardes et reprises.

Aucune image ni règle de récompense des ennemis ne change. Les cartes restent déclenchées par le ramassage effectif. L'XP que l'ancienne version avait déjà supprimée ne peut pas être récupérée rétroactivement.

## Vérification

`node --test tests/xp-conservation.test.js` couvre l'expiration, la distance, 2 000 récompenses dans un champ rempli, le ramassage unique du paquet, les deux aimants, les captures terminales, les anciennes sauvegardes, les reprises répétées et la validation des données.
