# Forêts, bâtiments variés et ville abîmée

## Direction

L'utilisateur a approuvé le 3 novembre 2026 une direction visuelle mêlant ville endommagée, garages, entrepôts, commerces, maçonnerie en ruine et forêts de conifères. L'intégration reste dans le même monde infini. Aucun portail, écran de chargement de zone ou nouvelle carte n'est ajouté. Les peintures complètes de Toma et ses animations ne sont pas modifiées.

## Monde

Les secteurs sont regroupés par blocs de 2 × 2. Environ 36 % des blocs éloignés deviennent boisés, de façon déterministe selon la graine. Le bloc de départ reste urbain; le bloc immédiatement à l'est est boisé pour que la nouvelle ambiance soit accessible rapidement. Les régions boisées contiennent des pins, rochers, souches, troncs tombés et parfois des vestiges de maçonnerie.

Les anciennes routes principales restent ouvertes; les clairières possèdent aussi des passages larges à travers leur centre. Les collisions des pins se limitent au pied du tronc. Les feuillages ne deviennent pas des murs invisibles. Les sites de découverte conservent leur génération et leurs règles temporaires, y compris au bord des forêts.

Les bâtiments urbains sont répartis en cinq familles : appartement, garage, entrepôt, commerce et ruine. Leur ligne de contact au sol est conservée. Les collisions des bâtiments bas suivent leur façade visible, sans conserver le volume invisible des anciens immeubles hauts. Leur apparence et leur degré de dégradation sont choisis avec un flux aléatoire indépendant, sans modifier les emplacements du mobilier urbain.

## Vérifications et limites

Les tests couvrent la présence et la diversité des régions, la continuité des routes principales et sentiers, l'accessibilité des découvertes, la régénération après éviction et les limites mémoire. Le test historique de densité du mobilier urbain est maintenant exécuté sur les secteurs urbains; les forêts possèdent leur propre contrat de végétation.

La validation graphique utilise les vrais modules du jeu et Canvas natif. Elle ne prouve pas le comportement tactile, la mise en page CSS ni les performances sur un téléphone physique. Aucun déploiement n'est effectué par ce travail.

## Résultats du 3 novembre 2026

- Suite complète : **96/96 tests réussis**, aucun échec ni test ignoré.
- Revue indépendante sur 40 graines : 1 778 secteurs boisés, au moins 12 pins et un rocher/tronc/souche par secteur, 1 021 vestiges de maçonnerie; 2 065 découvertes accessibles. Les routes, sentiers intérieurs et le départ restent libres.
- Régression graphique : six atlas secondaires, 65 entrées de personnage complet, 64 phases de course et 64 de grand écart, huit vues; rendu sans mutation, cache terrain limité à 48 tuiles et décor à 96 images. Atlas de Toma et points d'enregistrement identiques octet par octet à la référence.
- Moyenne locale Canvas native de 7,38 ms/image sur 100 images. Aucune revendication de performance navigateur ou téléphone.
- HTML autonome : 3 305 375 octets, démarrage et décodage des images validés par adaptateur DOM/Canvas, découverte et compte à rebours fonctionnels, pause/reprise validées.
- Le résultat suit la direction conceptuelle approuvée avec le style pixel art plus simple du jeu existant; ce n'est pas une reproduction pixel par pixel du mockup peint.

## Correspondance entre façade et obstacle

Les dimensions de façade, la boîte de collision et le tri de profondeur partagent `prop-geometry.js`. Un garage bas ne bloque plus la zone vide située au-dessus de son toit. Le pied du bâtiment reste la référence de profondeur, donc le dessin approuvé ne se déplace pas. Les tests couvrent le cas signalé (graine 42, secteur −4,−4), les cinq familles à trois tailles, les façades réellement dessinées et les mouvements bloqués contre les obstacles réels.

La revue indépendante du correctif de collision passe. Trente rendus natifs comparés (cinq familles, trois tailles, deux niveaux de dégradation) sont identiques octet par octet à leurs versions précédant ce correctif. Les captures de forêt, transition et planche de bâtiments sont également inchangées.
