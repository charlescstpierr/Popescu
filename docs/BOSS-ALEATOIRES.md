# Boss à moments aléatoires

## Règles

Les trois boss majeurs, Travestia, Péli Zodiaque et la matriarche, utilisent un seul calendrier. Les rivaux coq/bouc et les ennemis ordinaires gardent leur fonctionnement existant.

- Première arrivée tirée entre 150 et 210 secondes de jeu.
- Après chaque apparition réussie, le prochain boss et une attente de 95 à 165 secondes sont tirés et verrouillés. Ce délai ne descend que lorsqu'aucun boss majeur n'est vivant : la période de repos commence donc après la défaite.
- Les trois types sont mélangés dans un groupe, puis tous rencontrés avant de mélanger le groupe suivant. Aucun doublon immédiat à la jonction de deux groupes. La variété est garantie, sans faire alterner toujours les mêmes boss dans un ordre fixe.
- Le prochain boss est annoncé cinq secondes avant son arrivée. Pauses, dialogues, améliorations et écrans terminaux figent toute la simulation.
- Un boss vivant empêche tout autre boss majeur d'apparaître, même par un appel direct au moteur.
- À 300 ennemis, seul un ennemi ordinaire déjà hors écran peut libérer une place. Si tous sont visibles ou protégés, le boss attend et réessaie au plus une fois par seconde, sans nouveau tirage ni répétition de l'annonce. La variété reste garantie pour les rencontres qui ont effectivement lieu, pas lorsqu'une place ne peut jamais être libérée.

## Dernière minute et infini

L'annonce du dernier direct reste à 18 min 50. À 19 min, le jeu conserve le boss majeur encore vivant ; sinon il fait venir le prochain boss déjà tiré. Il ne force plus Travestia. Les arrivées ordinaires dont l'annonce déborderait sur cette finale sont retenues.

La victoire reste à 20 minutes. L'infini reprend le calendrier conservé. Si un boss annoncé était resté bloqué pendant la finale, une nouvelle annonce complète de cinq secondes est nécessaire avant son arrivée en infini. Ce réarmement ne change ni le boss ni le hasard futur.

## Sauvegarde et migration

Le schéma v6 enregistre un générateur aléatoire séparé du combat, le groupe restant, le prochain type, le délai, l'annonce et l'attente de capacité. Recharger ne retire rien au hasard. Les versions v1 à v5 sont migrées de façon déterministe sans modifier les PV, attaques, découvertes, records ou crédits cumulés.

Les anciennes sauvegardes pouvaient contenir une matriarche avec un autre boss. Elles conservent ces ennemis : aucun nouveau boss n'arrive avant que tous soient vaincus. Les doublons de Travestia ou de Péli et les états incomplets sont rejetés. Une fixture v5 réelle, produite avec le code précédent intact, vérifie cette transition ; la fixture v3 réelle reste également couverte.

## Vérification

- `npm test` : suite complète, notamment 80 graines et 960 rencontres, ordre varié, intervalles variables, gel pendant combat/écrans modaux, exclusions, plafonds, reprise exacte, migrations et finale.
- `node scripts/verify-boss-arrivals.mjs` : moteur réel dans les quatre difficultés, de 0 à 25 minutes, sauvegardes fréquentes, victoire à 20 minutes et poursuite en infini. La survie et la défaite des boss après 30 secondes sont contrôlées pour tester le calendrier, pas pour certifier l'équilibrage ou les performances mobiles.
- `python3 scripts/export-standalone.py release/Toma_Popescu_JOUER.html` puis `node scripts/inspect-standalone.cjs proof/random-bosses/standalone.png` : chargement des images intégrées, rendu, attaques, sauvegarde/reprise du calendrier en pleine annonce et arrivée du boss sélectionné dans le véritable code embarqué.

Aucun atlas, dessin, animation, style ou rendu n'est modifié. Les vérifications Canvas natives ne remplacent pas un essai tactile et de performance sur iPhone/Android physiques.
