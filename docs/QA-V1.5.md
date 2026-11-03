# QA v1.5 — personnage complet

Validation du 3 novembre 2026 après approbation des grands mockups de course et de grand écart.

## Résultat

80/80 tests passent. L'ancien assemblage de torse, cuisses, tibias et bottes est retiré du rendu et de l'export autonome. Chaque phase dessine une seule peinture complète, à sa résolution d'origine, avec un miroir horizontal pour les directions opposées. Le secours conserve aussi un personnage complet.

Les 13 images natives de la vue E sont identiques, pixel par pixel, au mockup approuvé. Les autres directions utilisent une échelle uniforme par feuille, réglée sur une hauteur médiane de course de 78,5 px. L'atlas contient 65 entrées complètes: huit pas et cinq entrées de grand écart pour chacune des cinq vues; certaines entrées de préparation inutilisées sont volontairement dupliquées.

## Mouvement et combat

La course dépend de la distance réellement parcourue, se fige dans les écrans modaux et repart à la phase de contact après le grand écart. L'arrêt conserve cette même pose de contact. L'entrée utilise les poses larges, le maintien répète exactement la même extension et la sortie revient vers la course sans passer par la pose debout plus haute.

La transformation continue essayée pendant le développement a été rejetée par la QA: elle soulevait une botte du grand écart. Toutes les peintures restent désormais intactes. La direction du corps dépend d'un point de visée stable au niveau du torse; les mouvements du canon entre deux images n'influencent que la trajectoire des balles. La rétention de direction de 3° évite le clignotement entre deux vues proches. Les balles partent du canon enregistré dans l'image choisie et visent la cible; l'éclat suit l'orientation du fusil dessiné.

Le test du moteur réel couvre 23 040 cas de tir: huit phases, huit directions réparties sur 360 angles, quatre distances 80/81/150/500 px et course/grand écart. Une revue indépendante a aussi contrôlé 4 320 cas, sans erreur d'origine du projectile. Les dégâts et la cadence à bout portant restent couverts. Un test exige une direction de corps constante pour une cible fixe à travers 24 images de course, sur 360 angles et trois distances.

## Inspection du résultat

Les vrais modules Game, HeroArt et Renderer ont produit une scène 390 × 844, des contacts de 64 phases de course et 64 phases de grand écart, et les attaques des rivaux. Les huit directions sont visibles, les huit pas diffèrent, le maintien entre 24 % et 69 % est identique et la tête descend de 14 px dans le grand écart approuvé. Les figures mesurent 71–82 px selon la vue et la phase. Les corps restent connectés et les bottes du grand écart restent au sol. L'état de simulation est inchangé par le rendu et le cache de terrain reste limité à 48 tuiles.

La moyenne locale sur Canvas natif est de 9,6 ms par image; cette mesure n'est pas une mesure de performance sur téléphone.

Le HTML autonome final de 3 280 980 octets a été exécuté avec un adaptateur DOM et Canvas natif, avec décodage des images et du portrait SVG. La partie, le rendu, les pauses, les améliorations, les dialogues, la continuité musicale et la réplique exacte au cri du coq passent. La QA indépendante retrouve les mêmes résultats.

## Limite

Le contrôle navigateur avait été bloqué par l'accès au site privé et l'infrastructure de prévisualisation. Aucun contournement n'a été employé. Le contrôle tactile, les safe areas et les performances sur iPhone/Android physiques restent à vérifier.
