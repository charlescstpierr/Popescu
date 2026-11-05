# Feuilles complémentaires de Toma

Créées le 5 novembre 2026 avec le générateur d'images intégré, en utilisant les peintures v5 comme références. Sources retenues :

- `southeast-mid.png` : corps entier orienté vers le bas-droite, canon à environ 32°. Une seconde passe enlève le chignon ajouté par le générateur, sans changer les poses.
- `south-southeast.png` : presque frontal, canon fortement raccourci pointant vers le bas et légèrement à droite, environ 67°.
- `north-northeast.png` : presque de dos, visage caché et canon montant fortement, environ −65°.

Chaque source comprend 4 colonnes et 3 rangées : huit phases de marche, puis station debout, demi-descente, descente profonde et grand écart. La préparation conserve chaque peinture entière, applique une échelle uniforme et un ancrage commun, puis repère le canon. Les poses de préparation inutilisées sont réutilisées, comme dans v5.

Le prompt commun demandait la même identité, palette, veste noir/violet aux liserés dorés, pantalon, bottes, arme tenue à deux mains, fond transparent, silhouette complète et cycle de marche. Les versions finales presque frontale et arrière utilisaient respectivement les vues S et N v5 comme références; elles demandaient une rotation de seulement 20° dans le plan du sol, pas une rotation du bitmap. Les premières propositions à angles insuffisamment distincts ont été rejetées.

Reproduction : `python3 scripts/prepare-hero-turns.py`, puis les deux exports. Le script préserve exactement les pixels de l'atlas v5; il ne faut pas remplacer celui-ci par v6. `registration.json` donne échelles, boîtes et canons de chaque pose.
