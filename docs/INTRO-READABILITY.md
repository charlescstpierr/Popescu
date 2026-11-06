# Réplique d’introduction lisible

Le 6 novembre 2026, le navigateur Chromium à 1180×757 a reproduit la première réplique tronquée sur la version correspondant à main `9e18bfa486856dd302c6828a1a0e1aa294fd8a04`. Le texte pouvait déjà défiler, mais sa zone mesurait 67 px pour 124 px de contenu. La carte réservée aux rencontres ordinaires ne prévoyait pas la note explicative supplémentaire de l’intro.

Une règle CSS limitée à l’intro et aux hauteurs ≥621 px réserve à la carte au moins 300 px ou 42 % de la hauteur intérieure. Le portrait du locuteur reste grand. Les petits écrans, la grille paysage, les textes, les contrôles, le moteur et les sauvegardes ne changent pas. Le défilement accessible des textes longs reste actif.

## Vérification navigateur

Prévisualisation isolée officielle Sites, application réelle. Les tailles mobiles ci-dessous sont des viewports d’iframe, pas des téléphones physiques. Valeurs clientHeight/scrollHeight en pixels :

- 1180×757 : première réplique 128/128, deuxième 123/123, troisième 143/143.
- 390×844 : 169/169, 169/169, 188/188.
- 320×568 : 80/80, 80/80, 98/98.
- 568×320 paysage : première réplique 87/87, deux colonnes et commandes visibles.

La révision visuelle indépendante confirme portrait, lisibilité et accès aux actions sur bureau, portrait standard et paysage. Revoir l’intro puis Tout passer retourne au menu; la partie sauvegardée existante reste proposée. Les tests source sont des garde-fous CSS et ne prétendent pas remplacer ces mesures navigateur. Pas de mesure sur téléphone physique ni de nouvelle validation du tactile matériel.
