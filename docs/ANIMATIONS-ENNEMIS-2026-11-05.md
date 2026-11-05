# Animations des ennemis : poses et vérification

Base initiale inspectée : `3681edd08e7581dd3fb33ab76fbc9d7d47594bff`. Intégration courante sur main `8e6e230516597ba7f06d1ec7f5312e5163a29498` après Toma #53. Candidat isolé, sans publication. Le correctif de rayon explosif #52 est séparé et n'est pas inclus ici.

## Fiches de mouvement

| Personnage | Identité conservée | Mouvement et attaque dans ce correctif |
| --- | --- | --- |
| Gorille normal | Fourrure et silhouette de l'atlas approuvé | Quatre appuis, une image tous les7px de marche réelle. Pose de contact au blocage. |
| Sprinter | Petit gabarit, détails roses | Quatre appuis,8px par image. La variation de vitesse existante entraîne la cadence par le déplacement, sans horloge parallèle. |
| Gazeur | Grand gorille et indices verts | Marche7px par image; quatre poses de gaz et compteurs existants conservés. |
| Tank | Gabarit massif et épaulières dorées | Marche10px par image; silhouette et contact conservés. |
| Jaloux | Motif de cœur brisé | Marche7px par image, poursuite et cible inchangées. |
| Explosif | Ceinture de dynamite | Marche8px par image; préparation et explosion inchangées. Rayon d'avertissement traité dans le correctif séparé #52. |
| Matriarche | Couronne et très grand gabarit | Marche12px par image; invocation existante conservée. Pas de nouveau geste d'invocation dans ce lot. |
| Orang-outan | Fourrure rousse, longs bras, soutien-gorge et nœud roses, boucles dorées | Marche9px par image. Nouvelle préparation entière0,6s; claque0,28s avec impact, fin de frappe puis retour. Deux bras peints; bras procédural supprimé. |
| Bouc rival | Costume violet, cornes, lunettes, barbe et sabots | Marche9px par image. Préparation0,8s en deux peintures; charge0,55s avec deux appuis alternés. Corps réellement abaissé, aucun cisaillement. |
| Coq rival | Crête rouge, queue orange, tenue violette, bijoux et baskets | Marche8px par image. Préparation0,85s en appui/appui/inspiration; cri0,7s, bec ouvert puis retour pendant les dernières0,12s. Onde et dégâts inchangés. |
| Autruche | Atlas animal approuvé | Deux appuis,14px par image. Poses d'alerte et d'attaque inchangées; récupération plantée. |
| Paparazzi | Atlas animal approuvé | Deux appuis,7px par image. Préparation du flash et attaque inchangées; récupération plantée. |
| Orignal | Atlas animal approuvé | Deux appuis,16px par image. Charge et collision inchangées; récupération plantée. |
| Poulet disco | Atlas animal approuvé | Deux appuis,7px par image. Alerte et attaque inchangées; récupération plantée. |
| Péli | Peintures entières existantes | Aucun changement de ses poses, déplacement enregistré, câlin, cartes et indications. |
| Travestia | Peintures entières existantes | Dash : tour puis armement, pose directionnelle verrouillée avant départ, freinage puis repos. Aucun nouvel atlas ni modification du spin. |

Les quatre animaux ego restent sur leur système d'animation propre; leur phase historique est préservée pour ne pas interférer avec leur chantier séparé.

## Règles de pose

- Les images approuvées existantes restent identiques octet pour octet. Trois nouveaux atlas d'attaque sont ajoutés, avec sources et prompts conservés sous `art/source/`.
- Une peinture entière par pose, avec translation, miroir horizontal éventuel et échelle uniforme. Aucun membre recomposé, étirement, rotation ou tremblement du corps.
- Orang-outan : cellules160×128, ancre[64,121], échelle83/128. Les32px supplémentaires contiennent la main tendue, sans recentrer le corps.
- Bouc : cellules128×128, ancre[60,121], taille88. Coq : ancre[68,121], taille78. L'ancre du bouc laisse une marge à la corne de dos en charge.
- Face/dos proviennent des vecteurs d'attaque déjà verrouillés. Les peintures offrent deux vues trois-quarts et leur miroir, pas huit perspectives anatomiques. Les indications au sol portent la direction et la portée exactes, comme avant.
- Travestia conserve les huit peintures directionnelles existantes pendant les dernières0,6s de préparation, tout le dash0,6s et les premières0,2s de freinage. Les transitions d'entrée et de sortie sont les profils entiers approuvés. Elles ne prétendent pas ajouter huit vues intermédiaires.
- Les fréquences d'attaque, vitesses, collisions, dégâts, trajectoires, RNG et données sauvegardées ne sont pas modifiés. La marche est un cache transitoire hors sauvegarde. Une reprise recharge le pied de contact, puis la distance réelle fait avancer le cycle.
- Le recul et la séparation de foule ne font pas marcher les pieds. Une pause conserve la dernière pose; un vrai arrêt reprend le contact.
- Si un nouvel atlas est absent, le sprite de marche approuvé reste le secours, sans déformation. Les avertissements et le moteur ne dépendent pas du chargement de ces peintures.

## Vérifications reproductibles

- `node --test tests/enemy-gait.test.js tests/enemy-attack-art.test.js tests/travestia-pose.test.js`
- `node scripts/verify-crowd-equivalence.mjs <copie-base> .`
- `node scripts/inspect-enemy-attack-transitions.mjs <sortie>` : six scènes, vrais `Game.updateEnemies` et `Renderer.render`,54 images à30Hz. Toutes les images vérifient que le rendu ne modifie pas l'état.
- `node scripts/inspect-travestia-transitions.mjs <sortie>` : huit directions,70 images et contact de sept étapes.
- `node --test --test-concurrency=1 tests/*.test.js`

Les tests de pixels lisent les PNG sans dépendance externe :28 poses distinctes, cellules transparentes et non vides, appuis à119–121px, aucun pixel opaque sur les bords. Les contrôles de rendu gardent les ancres, les directions verrouillées, les chronologies, le flash de dommage entier et le secours sans déformation.

La revue indépendante a trouvé un branchement initial qui gelait les entrées de marche des animaux ego. Il a été corrigé avant livraison et couvert par un test de non-régression des quatre espèces. Elle a aussi comparé la simulation de base et le candidat; résultats détaillés dans la livraison de QA.

Les captures et vidéos proviennent du moteur et du rendu Canvas natif réels. Elles ne constituent ni une validation sur téléphone physique, ni une mesure du plaisir des joueurs. L'animation active des charges animales et le geste d'invocation de la matriarche ne sont pas enrichis ici; les comportements existants restent explicites dans les fiches.

## Résultat de validation

- Suite complète en série : **1 473 tests réussis,0 échec,0 ignoré**.
- Équivalence initiale :4 320 ticks sur neuf scènes de foule. Revue indépendante :5 400 ticks supplémentaires sur trois graines, états et sauvegardes identiques.
- 32 assets préexistants identiques octet pour octet. Les trois nouveaux atlas sont aussi copiés sans recompression dans l'export hors ligne.
- Contrôle indépendant final favorable après la correction EGO; aucun blocage restant identifié dans le périmètre.
- Preuves conservées sous `proof/enemy-animations/` : contact et séquence réelle des trois attaques, contact et séquence des huit directions de Travestia, contact et mesures des personnages bloqués. Les fichiers JSON enregistrent les timers et positions des scènes de vérification.


## Intégration après Toma #53

La copie de base a été vérifiée contre les498 entrées de la tree Git `0ede73d95ace6b0d75a548187d2568517fb123f0` :444 blobs locaux exacts et54 blobs distants non matérialisés. Le SHA de la tree a aussi été recalculé. Le patch source s'applique sans conflit; aucune règle de simulation de Toma n'est reprise depuis l'ancien candidat.

Les trois modules Toma, l'atlas v6, le format de sauvegarde, l'application, le HTML, les styles, l'histoire et l'audio restent identiques octet pour octet au main #53. Les33 assets préexistants restent intacts. Le correctif explosif #52 est exclu : moteur à rayon87 et avertissement précédent conservés.

- 96 tests croisés Toma/attaques/sauvegardes réussis, sans échec ni test ignoré.
- 4 320 ticks de foule comparés au main #53 : états, événements et RNG strictement identiques.
- `scripts/inspect-toma-enemy-integration.mjs <sortie> <copie-main-53>` :240 images à30Hz. À chaque image, l'état gameplay, la vue, la phase, le canon calculé et la position de Toma sont identiques avant/après. Cette séquence contrôle ses virages et sa marche arrière; les tirs réels sont couverts séparément par les tests du moteur.
- Les scripts des preuves d'attaque chargent désormais le Toma courant via `HeroArt`, sans référence figée à l'ancien atlas v5.
- Suite complète de l'intégration sur #53 : **1 483 tests réussis,0 échec,0 ignoré**.
- Revue indépendante de l'intégration :167 tests ciblés réussis;14 directions observées dans les240 images comparatives, aucun problème bloquant trouvé. Rendu natif uniquement, sans certification navigateur/téléphone.
