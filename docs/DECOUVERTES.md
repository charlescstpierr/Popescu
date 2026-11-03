# Découvertes dans le monde infini

Cette évolution conserve la ville unique et infinie, les contrôles, le combat et la victoire à vingt minutes. Aucun portail ni changement de carte. Les images complètes de Toma restent intactes.

## Explorer

Des lieux apparaissent dans environ 42 % des secteurs de 512 px, avec un lieu garanti dans le secteur de départ. Ils se trouvent dans les emplacements libres en bordure des rues. Leurs silhouettes, couleurs et balises permettent de les repérer. Ils ne bloquent ni les déplacements ni les routes. Leur présence, leur type et leur position dépendent uniquement de la graine et du secteur : revenir après éviction du cache retrouve le même décor.

Approcher à 52 px active automatiquement une découverte. À moins de 210 px, le HUD indique le nom, le bénéfice et la consigne. Aucun dialogue obligatoire, bouton supplémentaire ou arrêt du combat. Un seul effet peut être actif à la fois. Le HUD affiche son compte à rebours et sa règle exacte.

- **Ruines du studio** : dégâts du fusil +35 % pendant 24 secondes.
- **Cabane de répit** : récupération de 2 PV/s pendant 16 secondes, plafonnée aux PV maximum.
- **Autel de validation** : rayon de ramassage +150 px pendant 24 secondes.
- **Épave de luxe** : vitesse +25 % pendant 20 secondes. Le véhicule est visiblement endommagé et ne se conduit pas.
- **Faille hors ligne** : événement spécial de 18 secondes, cadence du fusil environ +54 %, vitesse −10 %.

Les effets accompagnent le joueur après son départ. Les pauses, dialogues, améliorations et fins de partie figent leur durée. À expiration, les statistiques sont recalculées depuis les améliorations permanentes actuelles; une amélioration choisie pendant l'effet n'est jamais perdue.

Un lieu se recharge après 120 secondes de simulation. Il faut également s'en éloigner à plus de 78 px puis revenir pour le réactiver : rester immobile ne produit pas une boucle de bonus. La liste des délais de recharge est purgée à expiration et plafonnée à 256 entrées.

## Architecture et contraintes

- `dist/discoveries.js` : règles et descriptions partagées.
- `world.js` : génération indépendante, sans consommer le flux aléatoire des décors existants.
- `engine.js` : proximité, contact, recharge, effet actif, recalcul et récupération.
- `discovery-art.js` : cinq dessins Canvas sans mutation de la simulation.
- `app.js`, `index.html`, `styles.css` : HUD compact et non modal.
- `scripts/inspect-discoveries.mjs` : scènes natives 390 × 844 et planche de comparaison.

Aucun nouvel asset téléchargé, service distant, dépendance de jeu, déploiement ni modification des sources artistiques. La dépendance Canvas facultative ne sert qu'à la QA.

## Vérification

`npm test` couvre les règles de découverte ainsi que toutes les régressions existantes. Les nouveaux tests vérifient génération stable, cinq familles, accès sans collision, activation non modale, non-cumul, gel des durées, expiration, conservation des améliorations, recharge après sortie et mémoire bornée. Le rendu vérifie cinq silhouettes distinctes, absence de mutation et stabilité de la faille en mode effets réduits.

La revue indépendante initiale, avant l’ajout des régions boisées, a contrôlé 3 630 secteurs sur 30 graines : les décors existants sont identiques, et 1 565 lieux ont un centre et un accès par l'est libres de collision. Les mesures Canvas et les captures natives ne valident pas le toucher ni les performances d'un iPhone ou Android physique.

Le fichier `SOURCE_MANIFEST.json` reste le manifeste historique de la référence v1.5, et non un inventaire de cette évolution.

### Résultats initiaux du 3 novembre 2026, avant les forêts

- **88/88 tests passent**, sans échec ni test ignoré.
- Cinq scènes natives à 390 × 844 et une planche commune inspectées : ruines, cabane, autel, épave et faille distincts; aucun changement d'état pendant le rendu.
- Régression graphique complète réussie : six atlas secondaires et 65 entrées de personnage complet décodés, 64 phases de course et 64 phases de grand écart, huit vues, maintien du grand écart stable, hauteur 71–82 px, cache terrain plafonné à 48 tuiles.
- Moyenne locale de 7,42 ms par image Canvas native sur 100 images. Ce n'est pas une mesure FPS dans un navigateur ni sur téléphone.
- Export HTML autonome régénéré : 3 291 400 octets.
- Vérification indépendante du HTML autonome : script compilé sans import ES restant, démarrage avec adaptateur DOM et Canvas natif, décodage des atlas embarqués, bouton Jouer, activation d'une découverte, affichage du nom et du compte à rebours, rendu sans mutation, pause et reprise. Il ne s'agit pas d'un essai dans un navigateur réel; la mise en page CSS et le tactile restent à vérifier sur appareil.

- Régression HUD : après recharge, rester sur le lieu affiche « Éloigne-toi du lieu, puis reviens pour explorer. »; la consigne d’approche revient seulement une fois le contact rompu.

La validation du résultat combiné avec les forêts et les nouveaux bâtiments est dans [FORETS-ET-RUINES.md](FORETS-ET-RUINES.md).
