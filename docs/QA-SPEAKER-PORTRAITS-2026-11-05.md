# Portrait du locuteur à chaque réplique

## Changement

Le grand portrait et son cartouche suivent maintenant la personne qui parle : Toma, Blonde IA, Péli Zodiaque, Travestia ou Charles. La sélection ne dépend plus du propriétaire de la scène. L’identité de la rencontre, son acteur, le curseur de lecture et son historique restent indépendants et inchangés dans la sauvegarde.

La même sélection est utilisée dans l’introduction et les dialogues ordinaires. Les trois actions et les explications de l’introduction restent disponibles; l’introduction reste manuelle. Les messages système et les locuteurs sans portrait n’empruntent jamais le visage d’un autre personnage. Les échanges compacts pendant l’action restent sur leur voie existante.

Un nouveau portrait illustré de Toma, fondé sur les quatre photos de référence, remplace l’agrandissement du vieux petit portrait pour ces dialogues uniquement. La revue indépendante a validé sa ressemblance, sa cohérence avec les sprites corrigés et la visibilité du crâne, des lunettes et du menton. Les portraits des boss et les cinq apparences de Blonde IA sont conservés sans modification.

## Régressions vérifiées

- Les sept scènes réelles : invocation, Péli, Travestia et les quatre échanges Charles.
- Changements de locuteur, ouverture et fermeture de la présentation.
- Sauvegarde/reprise à chaque réplique, identité de scène et rang courant de Blonde IA.
- Arrêt du monde pendant la lecture, AUTO, blur/focus et visibilitychange.
- Images absentes, repli du portrait de Blonde IA niveau 1, callbacks tardifs et changement de locuteur avant la fin du chargement.
- Description accessible du locuteur et du rang de Blonde IA, y compris hors rencontre.
- Export hors ligne, images conservées octet par octet et script de fumée mis à jour.

Le test de régression a d’abord échoué sur l’ancien choix du portrait par rencontre, puis passé avec le nouveau choix par locuteur. Les anciennes assertions qui imposaient le boss sur une réponse Toma ont été remplacées.

## Revue visuelle et limites

`node scripts/inspect-dialogue-portraits.mjs <dossier>` produit 13 cas à partir des vrais PNG/SVG et des cadres choisis par le module de production. La revue indépendante a confirmé le décodage, le bon visage et les cadrages. Ce contact natif n’est pas une capture de l’interface d’un navigateur et ne prouve pas son layout CSS.

Le serveur local n’est pas accessible depuis le navigateur cloud disponible. Le candidat n’a pas été publié pour contourner cette limite. La mise en page CSS, les safe areas et les commandes tactiles doivent encore être observées dans un navigateur réel ou sur téléphone. La revue CSS ici est statique, les tests de contrôleur utilisent l’adaptateur DOM existant.

## Commandes

```sh
node --test --test-concurrency=1 tests/*.test.js
node scripts/inspect-dialogue-portraits.mjs /tmp/toma-dialogue-portraits
python3 scripts/export-offline.py
python3 scripts/export-standalone.py
node scripts/inspect-standalone.cjs /tmp/toma-dialogue-offline.png
node scripts/inspect-standalone.cjs /tmp/toma-dialogue-single.png generated/standalone/Toma_Popescu_JOUER.html
```

La première exécution concurrente a échoué dans `scenery-art`; ce test a passé seul puis lors des suites limitées à un fichier à la fois. La cause exacte de l’échec concurrent n’a pas été établie. Les résultats finaux sont consignés ci-dessous après reconstruction du candidat complet.


## Base d’intégration

Le candidat est basé sur `main` `97a58931459bb08bc4e960a8e1229c51d65406ed`, avec les animations de la PR #56 et le correctif d’explosion. Les 545 fichiers de la copie locale ont été comparés aux empreintes Git de cet arbre; aucune différence. Les 54 fichiers distants non matérialisés doivent être conservés lors de la publication en partant de l’arbre distant `3b45aca59fd7ccfccf5caa28a24fccb8a87b8d5a`, sans suppressions.

Aucune modification du moteur, du rendu de combat ni des atlas existants. Le test de Charles attend sa véritable arrivée protégée avant le premier dialogue, afin de ne pas masquer cette séquence.

## Résultat sur cette base

- Suite complète après intégration #56 : **1 553 tests réussis, 0 échec, 0 ignoré** avec `node --test --test-concurrency=1 tests/*.test.js`.
- Export dossier et export monofichier : démarrage natif, images, dialogues, sauvegarde/reprise et contrôles de fumée réussis.
- Revue indépendante du code, de la ressemblance du portrait et du cadrage natif : aucun défaut bloquant restant.
- Validation navigateur et téléphone physique : non effectuée, pour les raisons indiquées plus haut.

## Résultat final avec les sprites corrigés

Le candidat combiné associe le nouvel atlas Toma v7 et le nouveau portrait, sur la même base #56. Les exports sont reconstruits depuis l’ensemble, sans recopier un HTML ancien.

- **1 555 tests réussis, 0 échec, 0 ignoré** dans la suite complète séquentielle du candidat combiné.
- Les règles de mouvement, de collision et de sauvegarde, l’arrivée de Charles, les animations ennemies et le correctif d’explosion sont conservés.
- Les 561 fichiers du gel sprite ont été vérifiés par empreinte avant application du patch portraits; les 54 fichiers historiques absents localement restent à préserver dans l’arbre distant.
