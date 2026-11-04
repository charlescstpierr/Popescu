# QA — Intégration finale ville, histoire, Blonde IA et corrections

4 novembre 2026. Base GitHub : `08b1c3f6d25a177bcf1378a998feb39a7c186df2`.

## Périmètre

- Ville variée et conversations causales approuvées.
- Blonde IA à cinq niveaux : mêmes peintures complètes, portraits et soutiens que le lot approuvé. Aucun nouvel ennemi ni autre direction graphique.
- #20 : ignorer les répétitions d’Échap pour éviter une reprise involontaire.
- #21 : sérialiser les choix de résultats pendant la sauvegarde; une action Menu en cours ne ferme plus une nouvelle session Infini ou Charles.
- Correctif de reprise : une sauvegarde de résultats échouée ne modifie plus les compteurs d’une nouvelle partie créée par Retry. Le repli vérifie l’identité de la partie et son identifiant après l’attente.
- #22 : accepter les enveloppes de sauvegarde v11 et les migrer correctement vers v12, avec validation du contenu inchangée.

Les patches de production se combinent sans conflit. Deux ajouts en fin de `tests/app-records.test.js` ont été réunis en conservant le test Blonde IA et les trois tests Échap. Le test contrôleur de reprise v11 fourni avec la correction est inclus en plus des tests de stockage.

## Validation finale

- `npm test` : 844 tests réussis, aucun échec ni test ignoré.
- Cinq régressions utilisent le LockManager natif de Node 24.22.1 : échec puis Retry, réussite puis Retry, échec sur la même partie, Retry annulé, et échec puis Menu. Aucun test ignoré.
- Ancienne sauvegarde réelle : la fixture `tests/fixtures/runstore-v11.json` est lue et reproduite exactement par le code main v11 non modifié. Le candidat la lit sans réécrire les octets initiaux; menu, reprise, trophées, historique et compteurs restent valides, puis le nouvel enregistrement passe à v12 sans double crédit.
- Export autonome régénéré depuis les modules intégrés. Inspection générale réussie : démarrage, images, découvertes, pause/reprise, sauvegardes, Travestia, Péli, calendrier des boss et épilogue Charles.
- Inspection autonome Blonde IA réussie : atlas et cinq portraits embarqués, cartes du niveau suivant, cinq niveaux HUD, bouclier/drones, reprise des recharges et affichage du retour.
- Rendus réels des cinq niveaux dans la scène combinée : état de simulation inchangé.
- Revue indépendante : 120 tests ciblés puis 59 contrôles de sauvegarde/Charles/ville réussis. Un contrôle supplémentaire combine la vraie migration v11, chacun des cinq rangs, une conversation active puis Charles : 1 750 comparaisons de snapshots identiques entre les branches continues et reprises. Aucun défaut bloquant trouvé.
- Quatorze rendus de ville à 320/390 pixels passent : pixels identiques avec ou sans élimination des objets hors écran et aucune mutation de simulation.
- `git diff --check` réussi.

## Conservation et limites

Les 14 PNG source historiques absents localement restent référencés dans le manifeste; ils doivent rester inchangés dans l’arbre distant. Toutes les images runtime déjà présentes sur main sont conservées. Les nouveaux fichiers artistiques appartiennent uniquement à la Blonde IA approuvée. Aucune nouvelle sortie brute de preuve, image de contrôle ou journal n’est ajoutée sous `proof/`. Les preuves historiques déjà présentes sur main restent inchangées. Les scripts permettent de produire les nouveaux rendus séparément.

Ces tests utilisent Node.js, Canvas natif et un adaptateur DOM. Aucun navigateur réel, appareil tactile, safe area ou débit physique mobile n’est certifié. Les patches ne publient ni ne fusionnent rien.
