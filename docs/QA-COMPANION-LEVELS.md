# Blonde IA : cinq niveaux, une même compagne

Direction approuvée : même femme reconnaissable à chaque niveau; coiffure, couleur de cheveux et tenue changent réellement. Les trente peintures complètes gardent un visage, des yeux verts, un teint et des proportions cohérents. Six poses par rang : repos, deux pas de course, dos au repos et deux pas de course de dos. Le rendu ne découpe ni ne déforme les membres.

## Progression

1. Version gratuite : châtain long, veste rouge. Comportement initial conservé : suivi, cœurs, collecte, 95 PV et 20 bouclier au déblocage.
2. Mise à jour : carré bleu, veste turquoise. Suivi plus réactif et recul face aux ennemis proches, avec collisions normales. Aucune invulnérabilité ni téléportation de combat.
3. Version premium : tresses violettes et roses, tenue utilitaire. Rayon de collecte de la compagne augmenté de 45 px; celui de Toma reste inchangé. Les traînées d’objets suivent la même sélection de cible que la simulation.
4. Mode héroïne : queue haute argentée, tenue blanche et dorée. Restaure 4 bouclier toutes les 8 secondes actives à moins de 160 px de Toma, sans dépasser sa capacité. Le signal doré apparaît seulement lorsqu’un gain a réellement lieu.
5. Version ultime : couettes roses et cyan, long manteau holographique. Deux drones lancent chacun un mini-cœur de 6 dégâts toutes les 2 secondes. Ces tirs ne charment pas. Leur origine correspond aux drones dessinés.

Les avantages précédents restent actifs. Les PV, dégâts et cadences des cœurs principaux sont inchangés à chacun des cinq rangs : 70 + 25 × rang PV, 13 + 8 × rang dégâts, intervalle 1,25 / (1 + 0,22 × rang). Au rang 5, les drones ajoutent au maximum 6 dégâts par seconde avant Amour viral; le cœur principal reste à environ 89 dégâts par seconde. Amour viral conserve ses prérequis et sa limite de trois ennemis distincts par cœur, y compris les mini-cœurs, sans ajouter de charme à ceux-ci. Le bouclier supplémentaire reste modeste : 0,5 point par seconde au maximum, en présence de la compagne.

## Interface et sauvegardes

Les cartes affichent le portrait et le bénéfice exact du prochain niveau. Le HUD affiche le niveau courant, le soutien principal et le compte à rebours de retour lorsqu’elle est à terre. Les cinq portraits proviennent des mêmes peintures que les personnages.

Les nouveaux états de marche, recharge et signal restent optionnels pour les sauvegardes anciennes. Aucun changement du numéro de schéma ni du stockage n’est nécessaire. Les anciennes données sont acceptées sans rejouer une acquisition. Les recharges nouvelles survivent à une reprise et restent figées en pause ou dans un écran modal. Le déplacement réellement parcouru pilote les pas; une collision, un arrêt ou une remise en place ne fait pas courir sur place.

## Vérifications

- Suite complète : **824/824 tests réussis**, dont 21 ajouts liés à cette progression.
- Revue indépendante : aucun blocage. Deux détails corrigés après revue : composition de la planche et traînées dans le rayon de collecte supplémentaire.
- Contrôles des cinq rangs, cœurs historiques, drones sans charme, gain de bouclier plafonné, ancien format, données malformées, pause, morts/retour, collecte et marche réelle.
- Reprise déterministe après un combat de 300 ennemis, avec vérification des plafonds de projectiles, particules et effets.
- Rendu réel 390 × 844, état de simulation inchangé. Mesures Canvas natives par rang : environ 1,6 à 4,6 ms par image sur la scène de preuve. Ce n’est pas une mesure sur téléphone.
- HTML autonome régénéré; tests de démarrage, images embarquées, cinq portraits/cartes/HUD, bouclier, drones, sauvegarde/reprise et retour de la compagne réussis.
- Images de contrôle générables séparément par les scripts `inspect-companion.mjs` et `inspect-companion-art.mjs` : cinq rangs, planche de jeu et contact d’animation. Les sorties brutes de preuve ne sont pas incluses dans cette livraison.

## Limites

Le navigateur cloud n’a pas pu joindre le serveur local de cet environnement (connexion refusée). La disposition réelle du navigateur mobile, le tactile et les performances sur iPhone/Android physiques ne sont pas certifiés. Les captures de jeu proviennent du vrai Renderer avec Canvas natif, sans le HUD DOM. Aucun changement aux ennemis ni aucune publication externe n’ont été effectués dans ce lot.
