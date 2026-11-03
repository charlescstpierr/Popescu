# Animations des quinze autres pouvoirs

Lot du 3 novembre 2026, basé sur les cinq feuilles visuelles approuvées. Il complète les cinq pouvoirs du lot précédent, sans modifier les règles du jeu.

## Acquisitions et usages

Les quinze choix reçoivent une signature distincte: Abonnés fictifs, Ego surdimensionné, Selfie de milliardaire, Charisme imaginaire, Chopper inexistant, Filtre beauté, Validation sociale, Fuite très stratégique, Pouvoir d'attraction, Détox de commentaires, Lambo de milliardaire, Amour viral, Pause protéinée, Petit contrat et Compliment gratuit.

- Les gains de PV et de bouclier montrent les quantités réellement restaurées, avec une petite barre avant/après. Le contrat anime les huit pièces réellement reçues.
- Les trois pixels bleus des abonnés rejoignent le canon réel. La cadence et les tirs supplémentaires restent ceux du moteur.
- Les billets sont les vrais projectiles; un plus de soin apparaît seulement quand une pièce augmente réellement les PV.
- Les petits traits roses suivent seulement les ennemis effectivement déplacés et ralentis. Les cœurs existants gardent leur charme.
- La moto holographique cyan n'a pas de pilote. Réservoir, moteur à ailettes, selle, fourche et échappement la distinguent du vélo de décor. Les traces et impacts suivent sa direction réelle.
- Le filtre ajoute un mince contour sur le dessin complet de Toma près d'un gaz actif. Il ne dissipe pas le nuage. Son signal de résistance apparaît seulement après un véritable dégât de gaz réduit.
- Les segments du bouclier restent transparents. Le signal de recharge nécessite une augmentation réelle, après le délai existant.
- Deux rémanences dorées utilisent l'image complète de Toma, avec sa matrice et son ancre exactes. Elles exigent un déplacement réel, pas une commande contre un mur.
- L'attraction ne marque que des objets effectivement en mouvement vers Toma ou la compagne. Elle ne cible jamais les ennemis.
- La détox conserve son soin continu d'origine et ne montre une petite pulsation que si les PV augmentent.
- La voiture évoluée garde exactement deux salves de trois billets. Le cœur viral reste un seul projectile et touche au plus trois ennemis distincts; aucun faux rebond après la dernière cible.

## Lisibilité, sauvegarde et limites mémoire

Le moteur ne consomme aucun tirage aléatoire pour ces ajouts. La queue d'effets reste limitée à 16; les marques d'attraction et de ralentissement sont limitées à trois chacune. Les soins et recharges sont regroupés, sans changement des soins réels. Les masques de dessin du héros sont limités à 24 cellules en cache. Les personnages et atlas d'origine sont inchangés.

Toutes les animations utilisent le temps de simulation. Elles se figent pendant les écrans modaux et ne sont ni sauvegardées ni rejouées au chargement. Une seule acquisition, la plus récente, est affichée à la fois. En effets réduits, les répétitions décoratives sont supprimées: au plus un badge d'acquisition et un usage éloigné; les badges passifs locaux restent au-dessus de la tête plutôt que sur le visage ou le torse.

## Vérifications reproductibles

- `npm test`: 498 tests réussis, aucun échec, après les dernières corrections.
- `node scripts/verify-remaining-power-equivalence.mjs ../popescu-power-animations .`: les vingt choix, puis 24 scénarios combinant quatre difficultés, deux graines et les rangs 1/3/5. Chaque scénario avance de 600 images avec une sauvegarde/reprise à mi-chemin. Les états de jeu, RNG, temporisateurs et sauvegardes correspondent au socle. Seuls les anneaux purement visuels `s.pulses` sont exclus; les effets transitoires sont hors sauvegarde.
- Le même script vérifie les SHA-256 de tous les fichiers d'images d'exécution.
- `node scripts/inspect-remaining-powers.mjs`: vraies captures natives 390 × 844 de chaque acquisition et usage, leurs variantes réduites, cinq contacts, une vue 320 × 640 et la charge maximale de 300 ennemis.
- `node scripts/render-remaining-power-preview.mjs`: vidéo native de 900 images à 24 images/s, durée 37,5 secondes, sans accélérer la simulation.
- Export autonome régénéré, puis `node scripts/inspect-standalone.cjs /tmp/popescu-remaining-standalone.png`: démarrage, images embarquées, lecture seule du rendu, pause/reprise, sauvegardes, découvertes et phases de boss validés.

La première revue visuelle indépendante a identifié un contour de filtre décalé et des badges réduits superposés. Les deux causes sont corrigées avec des tests ayant échoué avant correction; les captures ont été refaites. La moto a aussi été renforcée pour mieux correspondre au concept approuvé. La seconde revue indépendante valide le contour, les rémanences, la moto et les effets réduits. Une capture supplémentaire prouve la collision réelle de la moto: 63 dégâts et recul de 85 pixels, avec assertions du moteur.

Mesure native isolée finale à 300 ennemis et 16 événements: 17,78 ms/image en mode normal, 17,01 ms en réduit. Ces chiffres dépendent de la charge de la machine et ne garantissent pas une cadence sur téléphone.

## Limites

Canvas natif seulement: aucune certification navigateur, tactile, safe areas ou iPhone/Android physique. Les quatorze anciennes sources artistiques haute résolution déjà manquantes dans le socle ne sont pas utilisées par ce lot. Aucun envoi GitHub ni déploiement n'est effectué ici.
