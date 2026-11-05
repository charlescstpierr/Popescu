# Cohérence, onboarding et fermeture des dialogues

## Périmètre

Le candidat complète les scènes causales et la correction des indications de combat déjà présentes. Il ne réécrit pas l'histoire ni les répliques demandées. Les animations de Toma, les monstres, l'arrivée de Charles et sa séquence finale sont hors périmètre.

`HISTOIRE-ET-PERSONNAGES.md` fournit le fil narratif réel, l'ordre des scènes et des fiches pour tous les personnages. Les fiches distinguent faits, vantardises, règles, voix et interdits de continuité. Elles ne constituent pas un témoignage de joueurs ni une nouvelle biographie réelle.

## Problèmes constatés et corrections

### Réponse de boss après fermeture de l'amorce

Péli et Travestia utilisent des champs de réponse différée pour leurs provocations compactes, contrairement aux conversations dotées d'un curseur de scène. Fermer la bulle supprimait le texte visible, mais laissait la réponse de Toma programmée. Si une alerte avait interrompu le texte, cette réponse pouvait déjà se trouver dans la file au retour de l'amorce.

`dismissSpeech` annule maintenant le délai et la réponse en file du seul boss concerné lorsque le joueur ferme sa provocation. Le dialogue d'un autre personnage, l'alerte en cours et les nouvelles paires restent intacts. Les horloges d'attaque ne sont pas touchées. Aucun champ, identifiant ou format de sauvegarde n'est ajouté.

Six régressions échouaient sur la source initiale : fermeture simple, fermeture après reprise sauvegardée et fermeture de l'amorce reprise avec réponse déjà en file, pour chacun des deux boss. Elles passent avec la correction. Les contrôles positifs conservent les réponses non fermées, les conversations sous une alerte fermée, les autres acteurs en file et la paire suivante.

### Boucle de progression absente du tutoriel

Le tutoriel indiquait seulement le déplacement et le tir. L'information sur les éclats bleus existait dans le manuel, mais pas dans les premières secondes de jeu. La phase `shoot` montre désormais le tir pendant ses quatre premières secondes, puis « Éclats bleus = expérience. Ramasse-les pour choisir un pouvoir. » jusqu'à sa fin inchangée à huit secondes.

Aucune nouvelle étape, pause, condition de progression ou donnée persistée n'est créée. L'aide dérive uniquement du temps déjà sauvegardé. Le bouton PASSER et la reprise des phases `move`, `shoot` et `done` gardent leur contrat.

### Compagne hors ligne expliquée seulement dans des paroles facultatives

L'ouverture annonce une panne, mais l'explication de la compagne locale pouvait dépendre des répliques en action, désactivables. La description de sa carte commence désormais par « Copie locale hors ligne ». Les cinq looks et pouvoirs restent décrits. Les cinq lignes de son invocation, strictement validées dans les sauvegardes, sont inchangées.

## Vérifications

- Nouvelle sélection : 15 tests passent, dont neuf échecs attendus observés avant correction (six fermetures et trois exigences d'onboarding).
- Suite complète finale : 1 457 tests réussis, aucun échec, aucun ignoré.
- Exports, exécution hors ligne native et ordre des modules : 10 tests réussis, aucun échec, aucun ignoré.
- Comparaison à la base sur deux boss et trois graines, 1 000 étapes de 50 ms par combinaison : 6 000 états de combat identiques après fermeture, hors seuls champs de réponse intentionnellement annulés. Positions, dégâts, phases, RNG et directeur de boss correspondent. Cette mesure isole la mise à jour des ennemis; elle ne prétend pas être une simulation de vingt minutes par un humain.
- Export du dossier régénéré : HTML de 652 559 octets, 32 assets.
- Export monofichier facultatif régénéré : 27 433 313 octets.
- Textes d'ouverture, tableaux de répliques, portraits, images, CSS, structure HTML source et module de sauvegarde inchangés. La seule modification de `content.js` est la description de la carte Blonde IA; la correction des indications contextualisées reste intacte.
- `git diff --check` sans erreur.

## Intégration et limites

Appliquer les changements ciblés, en particulier la seule ligne de description de `content.js`, sans remplacer les fichiers complets qui peuvent être modifiés par d'autres travaux. Régénérer le dossier hors ligne et son manifeste après l'intégration finale.

Le contrôle natif hors ligne n'est pas un test de navigateur mobile ni un test tactile sur téléphone. L'évaluation de plaisir et de compréhension doit rester présentée comme une revue du jeu, jamais comme l'avis de personnes qui n'y ont pas joué. La revue indépendante a confirmé les 1 457 tests et des exports identiques avant publication. Aucun déploiement du Site n'est inclus.

Base GitHub vérifiée pour la publication : `8db2fe06fe594cb23b8c0b70d0c74ec2dcbe602d`. Les 426 fichiers matérialisés de la base ont la même empreinte Git; les 54 fichiers absents de la copie de travail sont conservés grâce à un arbre dérivé de celui de main, sans suppression. README et le guide des exports distinguent désormais les mesures historiques du manifeste courant.
