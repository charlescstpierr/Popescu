# Charles arrive directement à vingt minutes

## Cause et correction

Le moteur passait encore en `victory` à 20:00 et envoyait immédiatement l'écran de résultat. Le vol et le claquement existaient déjà, mais ne démarraient qu'après le bouton facultatif « Rencontrer Charles ».

Le seuil lance maintenant directement l'arrivée existante. Aucun événement ni son de victoire n'est envoyé avant la scène. Les ennemis restent visibles pendant le vol, se dissolvent après le claquement à 3,45 secondes et disparaissent à 4,05 secondes. Le dialogue et le combat de Charles suivent normalement. Le résultat reste accessible après avoir quitté la rencontre ou avoir été mis K.O. par Charles, puis l'infini demeure disponible.

L'événement de début remet le HUD au premier plan, relâche les touches et le joystick et demande immédiatement une sauvegarde. Une amélioration ou un coffre gagné pendant le même pas conserve ses choix pour l'infini. Une mort pendant ce pas conserve sa priorité et ne démarre pas Charles.

Le chronomètre de survie, les records, les clés de stockage et le schéma v15 ne changent pas. Les anciennes sauvegardes déjà arrêtées à l'écran de victoire gardent leur choix manuel de rencontrer Charles. Les sauvegardes avant le seuil et pendant le vol reprennent sans rejouer un claquement déjà passé.

## Vérifications

La suite finale `taskset -c 0 npm test` passe : 1 586 tests, aucun échec, aucun test ignoré. L’affinité à un cœur limite les processus graphiques simultanés : la première exécution parallèle avait interrompu les tests `offline-export`, `offline-smoke` et `scenery-art`; ils passent intégralement dans cette exécution finale. Les anciennes attentes de victoire immédiate ont été adaptées à l’arrivée.

- Régression reproduite avant correction : les quatre difficultés affichaient `victory` avec `charles=null`.
- `tests/charles-automatic.test.js` couvre le vrai franchissement du seuil, absence de victoire, vol, claquement unique, disparition sans récompense, dialogue/combat, sauvegardes avant/après le claquement, contrôles, amélioration simultanée, demande immédiate de sauvegarde, mort prioritaire et infini.
- Les tests existants du seuil ont été mis à jour pour la nouvelle séquence, sans supprimer leurs protections de progression, coffres ou reprise.
- Dossier `release/` régénéré depuis `dist/`; export monofichier généré séparément.
- Le script `scripts/inspect-charles-arrival.mjs` franchit maintenant réellement 1199,99 → 1200 secondes au lieu d'injecter une victoire. Il vérifie le vrai moteur et le vrai Renderer à 390 × 844 et 320 × 568, avec et sans effets réduits, sept témoins dont les quatre créatures EGO, et l'absence de mutation par le rendu.
- Revue indépendante favorable du code, de 43 tests ciblés et des séquences natives 390 × 844 et 320 × 568 avec effets réduits.

Les preuves Canvas natives et le contrôleur avec adaptateur DOM ne constituent pas un essai tactile sur téléphone physique. Aucun atlas ni dessin n'a été changé. Cette correction n'ajoute aucun déploiement automatique.
