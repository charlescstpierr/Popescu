# Choix de progression : audit et amélioration

## Périmètre

Copie de référence : `f8d698ea`, fournie dans le dossier hors ligne. Lecture du compte rendu de jeu réel du 4 novembre 2026, du moteur et de ses tests. Le présent travail ne constitue pas une nouvelle session humaine, ni une preuve de plaisir « 10/10 ».

Le test navigateur précédent montre plusieurs parties courtes (record 4:50), des relances réellement utilisées et des choix de niveau fonctionnels. Il ne permet pas d'attribuer les défaites à l'équilibrage ni de mesurer un taux de victoire. Il ne couvre ni les vingt minutes ni un téléphone physique.

## Constat corrigé

Les trois cartes étaient uniformément tirées parmi les pouvoirs restants. Sur 10 000 graines mélangées déterministes, 1 205 offres ne contenaient aucun pouvoir offensif et 1 280 aucune option de survie ou de contrôle. Le joueur pouvait ainsi gagner un niveau sans avoir de choix entre augmenter sa puissance et mieux résister à la pression.

Le nouveau tirage conserve trois cartes distinctes et le hasard. Il privilégie une option offensive et une option de survie/contrôle quand le pool le permet. La troisième place reste libre. Les évolutions prêtes conservent leur priorité et leur place en tête. La protection, les ralentissements, la vitesse et les soins comptent comme survie; Attraction et les pièces restent des options libres.

Lors d'une relance, le moteur maximise ensuite le nombre de cartes nouvelles parmi les offres respectant cette diversité. Il conserve les coûts 5 puis 10, la limite de deux relances et le refus d'un achat sans solde. Si aucune offre différente ne reste possible, le bouton est désactivé et aucune pièce n'est débitée.

Le moteur ne change ni dégâts, PV, apparitions, durée de vingt minutes, pouvoirs, prérequis, contrôles, dessins ni format de sauvegarde. Il garde exactement un tirage RNG par carte non imposée par une évolution. Une ancienne sauvegarde conserve ses trois cartes exactes, même si elles ne respectent pas la nouvelle règle; elle reste jouable. Les offres futures suivent la nouvelle règle.

## Résultats mesurés

Commande reproductible :

```
node scripts/verify-upgrade-draft.mjs /chemin/vers/la/reference .
```

Sur les mêmes 10 000 graines :

- Sans option offensive : 1 205 avant, 0 après.
- Sans option de survie/contrôle : 1 280 avant, 0 après.
- Cartes dupliquées : 0 avant et après.
- Pouvoirs présents : les 15, dans chacune des trois positions possibles.
- Ensembles de trois cartes observés : 455 avant, 343 après. Les ensembles exclus sont précisément ceux sans l'un des deux rôles.

La distribution change réellement, même si aucun chiffre de combat n'est modifié. Dans le pool initial complet, Attraction passe théoriquement de 20 % de présence à 14,286 %. Chacun des quatorze autres pouvoirs passe à 20,408 %. L'échantillon retrouve 2 034 puis 1 394 apparitions d'Attraction. C'est le compromis de cette version : davantage de choix immédiats entre attaque et survie, moins d'offres entièrement utilitaires. Cela ne prouve pas que tous les styles de jeu ou toutes les graines deviennent plus faciles ou meilleurs.

## Vérification et revue

- Dix tests dédiés : rôles, quinze pouvoirs et trois positions, relances entièrement fraîches lorsque possible, pools réduits, évolutions, refus des relances identiques, consommables, pause, reprise exacte, anciennes cartes et budget RNG.
- Avant implémentation, cinq des neuf premiers tests échouaient sur les propriétés ciblées. Les quatre autres documentaient les comportements existants à conserver.
- La première suite complète a signalé 24 échecs de préparation dans les tests de dialogues : ils supposaient que `rng=4` proposait toujours Blonde IA. Le helper de test recherche maintenant une graine donnant réellement la carte, puis exerce normalement le niveau et le clic. Aucune assertion de dialogue, de focus ou de sauvegarde n'a été retirée.
- Revue indépendante : 97 941 combinaisons de pools et d'évolutions comparées à une énumération distincte; priorité des rôles et nombre maximal de cartes nouvelles conformes. Sur 1 000 états de progression, le budget RNG reste identique à l'ancien tirage et les consultations du bouton ne consomment aucun hasard.
- L'export inclut le nouveau module avant le moteur. Dossier hors ligne et monofichier régénérés; tests d'export exécutés.

## Grille d'évaluation utile

Ces critères sont vérifiables, pas des notes scientifiques de plaisir :

1. **Choix accessibles.** Trois cartes distinctes, attaque et survie disponibles lorsque possible, aucun achat de relance identique. Couvert par cette correction.
2. **Progression compréhensible.** Les cinq rangs de la compagne et de la voiture ont des descriptions spécifiques. Les autres cartes gardent surtout une description générale; montrer la différence exacte du prochain rang reste une amélioration utile, indépendante de ce tirage.
3. **Équité des attaques.** Les nouvelles créatures annoncent et verrouillent leurs attaques. Les tests couvrent leur géométrie, interruption et sauvegarde; la lisibilité au milieu des hordes reste un sujet distinct et ne peut être conclue à partir du code seul.
4. **Variété et rythme.** Le jeu possède déjà des comportements distincts, des compositions de hordes alternées, des répits de quinze secondes et un final annoncé. Ajouter encore des ennemis sans mesurer l'écran ne serait pas prioritaire.
5. **Reprise fiable.** Cartes, RNG, relances, pièces, pouvoirs et menus restent cohérents après sauvegarde; aucun nouveau champ persistant n'est ajouté.
6. **Expérience longue et mobile.** Le test réel à vingt minutes et le tactile sur téléphone physique restent nécessaires. Des tests Node ou Canvas ne les remplacent pas.

## Intégration

Appliquer le patch source, conserver les autres modifications du moteur, puis régénérer le dossier hors ligne depuis la copie combinée. Ne pas remplacer tout `engine.js` par cette copie isolée. Aucun envoi GitHub ni déploiement n'a été effectué par ce travail.

## Revalidation du 5 novembre 2026

- Dépôt courant vérifié : `charlescstpierr/Popescu`, référence `f8d698ea4c038191ca4f24c2f855f2c71c009d22`. Le nom de dépôt prévu dans `REPRISE.md` est historique. Aucun travail ouvert consulté ne faisait doublon avec ce tirage; les tickets #38 et #39 concernent respectivement Cœur viral et les dialogues des boss. Le suivi de ce candidat a ensuite été ouvert dans le ticket #42.
- Les 403 fichiers matérialisés de la référence correspondent exactement à leurs empreintes Git. Les 54 fichiers non matérialisés, dont les sources artistiques et les archives historiques, restent hors du patch et doivent être conservés lors de toute intégration.
- Les dix tests dédiés ont été réexécutés contre le moteur de référence : cinq échecs attendus sur la diversité et les relances, cinq comportements préservés. Tous passent sur le candidat.
- `npm test` : **1 280 réussites, aucun échec et aucun test ignoré**. Le sous-ensemble ciblant les cartes, le contrôleur de relance, les interruptions de dialogues, les sauvegardes et les exports compte **217 réussites**. La suite couvre notamment l'achat atomique, le double clic, l'échec d'écriture, l'onglet concurrent et la reprise des cartes payées.
- La revue indépendante de cette reprise est favorable : suite de 1 280 tests, comparaison à un oracle de tirage et 250 anciennes sauvegardes comparées.
- La comparaison de 10 000 graines retrouve les chiffres ci-dessus. Les clés de stockage, le format v15 et `run-save.js` sont inchangés.
- Les deux exports sont reproduits octet par octet après régénération. Les trois contrôles Canvas natifs du dossier hors ligne passent dans la suite; les trois mêmes contrôles ont également été exécutés sur le monofichier généré.
- HTML du dossier : 645 754 octets, SHA-256 `fd15a31074ca2c82ef46b1f69946d8ebdd4606ed752e32ee5188927a5140c186`. Monofichier : 27 426 508 octets, SHA-256 `a829e41b3c244f9169e4dc0e7b7974819456faa5016b779a63fcca5552c60ccf`.

Cette revalidation achève le candidat existant sans ajouter de nouvelle mécanique, sans modification graphique et sans publication. Elle ne certifie ni le plaisir de jeu, ni le toucher ou les performances sur téléphone physique. Les chiffres de distribution ne constituent pas une mesure de difficulté ou de taux de victoire humain.
