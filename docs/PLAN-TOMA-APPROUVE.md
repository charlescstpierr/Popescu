# Toma approuvé — intégration

Historique de la v1.4. L'assemblage de jambes décrit ici a été rejeté après essai par le joueur. La v1.5 le remplace par des images complètes; voir `PLAN-TOMA-MOUVEMENT.md`.

Le joueur a approuvé le mockup pixel art du 3 novembre : calvitie marquée, lunettes reculées, cuir sombre avec reflets violets et dorés, fusil tenu à deux mains et grand écart complet. Ce dessin devient la référence visuelle du personnage en jeu.

1. Préparer les vues directionnelles depuis ce modèle. Garder tête, torse, bras et fusil dans un même dessin pour préserver la prise; enregistrer la bouche du canon et la hanche dans chaque vue. Conserver la même échelle entre les poses.
2. Remplacer le rendu de Toma par ces pièces illustrées, avec les jambes animées indépendamment. Utiliser la même géométrie pour la position du canon et les projectiles. Pendant la split, descendre le torse et étendre les jambes sans étirer le visage ni le fusil.
3. Vérifier les directions, la marche, les transitions du grand écart, le chargement des images et le rendu de secours, puis exécuter les tests et une validation visuelle indépendante.
4. Mettre à jour le fichier HTML autonome et publier sur le même lien privé. Garder les autres personnages et les mécaniques existantes.

Points de contrôle : conservation du modèle approuvé à petite échelle; mains et arme solidaires; canon réel et origine des balles concordants; épaules/hanche attachées pendant les transitions; aucune image réassemblée de façon flottante; état de jeu inchangé par le rendu.

Le flux Sites possède le commit et la publication; les vérifications précédentes et la limitation de test sur téléphone réel restent applicables.

Vérification en cours : le portrait UI utilise le SVG du modèle approuvé. Un test a reproduit une balle partant à l’envers lors d’un tir à bout portant avec le canon déjà au-delà de la cible; le coup applique désormais les dégâts habituels directement, conserve cadence et multiplicateur des abonnés, et ne crée pas de projectile inversé. Le test de régression passe. Les tirs à distance gardent la géométrie du canon illustré.

Le rendu est intégré et inspecté dans la vraie scène Canvas : cinq vues illustrées, trois miroirs, jambes texturées et peinture du grand écart approuvé. Le solveur analytique verrouille la vue choisie et corrige le décalage découvert entre deux directions. Le test réel des projectiles couvre2 880 cas de visée (360° ×80/81/150/500px ×course/grand écart). Les pixels approuvés remplacent aussi le secours du haut du corps. La réplique demandée au coq est déclenchée par son vrai cri et protégée des réponses en attente.

Validation finale locale :76/76 tests passent; Canvas11,06ms par image dans l’inspection locale, état inchangé, caches bornés. HTML autonome exporté avec le nouveau module et le portrait SVG. Revue indépendante et publication restent les deux étapes de livraison.
