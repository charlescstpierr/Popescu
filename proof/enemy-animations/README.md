# Revue des animations ennemies

Base : main 3681edd. Voir `docs/ANIMATIONS-ENNEMIS-2026-11-05.md` pour les fiches, le périmètre et les résultats.

- `sequence.mp4` et `contact.png` : orang-outan, bouc et coq, face/dos.54 images à30Hz du vrai moteur et du vrai Renderer Canvas. Chaque scène390×422 est une fenêtre de rendu logique, pas un test de téléphone physique.
- `replay.json` : compteurs, phases, coordonnées et dégâts observés pendant cette séquence.
- `travestia-sequence.mp4` et `travestia-contact.png` : huit directions,70 images à20Hz. Moteur et peintures réels; le contact contient aussi les sept étapes isolées.
- `blocked-locomotion.png/json` : quatre rendus successifs après collisions bloquantes; zéro déplacement et un seul corps raster différent par personnage. Péli et Travestia restent sur leur sélection dédiée, déjà stable.

Revue indépendante : claque à deux bras, bouc abaissé sans déformation, cri du coq lisible, pieds stables et phases Travestia cohérentes. Une régression initiale de l'entrée de phase des quatre ego a été détectée, corrigée et retestée avant cette livraison.

Aucune mesure de plaisir des joueurs ni certification navigateur/téléphone. Les quatre ego, Toma et Charles sont des chantiers séparés; leurs images ne sont pas modifiées ici.

## Intégration Toma #53

Les scènes d'attaque et de blocage ont été régénérées sur main 8e6e230 avec Toma v6 chargé par son module officiel. `toma-main53-integration.mp4/png/json` compare le main #53 et le candidat pendant huit secondes de virage et de marche arrière. Les 240 comparaisons de l'état gameplay et des poses Toma sont identiques. Les tirs sont contrôlés par les tests du moteur, pas par cette vidéo de mouvement.
