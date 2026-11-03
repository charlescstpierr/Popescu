# Cinq animations de pouvoirs

Le premier lot reprend les cinq lignes du mockup approuvé le 3 novembre 2026. Il ne modifie pas les autres pouvoirs.

## Rendu intégré

- Lamborghini imaginaire: pictogramme doré à l'acquisition, chevrons dans la vraie voie du véhicule et trois petits traits de vitesse attachés à la voiture.
- Blonde IA: cœur rose, apparition soulignée autour de la compagne brune existante, projectiles cœur inchangés et petits cœurs lors d'une collecte réelle par la compagne.
- Mode avion: un seul pictogramme au-dessus de Toma, coins cyan de protection et bref éclat local à l'activation. Le véritable rayon défensif reste affiché à sa taille réelle. Le gaz disparaît et les attaques sont interrompues sans dégâts ajoutés.
- Muscles Photoshop: bras rose, coins de retouche et deux étincelles sans redimensionner le personnage. Les balles réellement renforcées portent une courte traînée rose.
- Vérité brute: diamant cyan puis éclat ivoire/lilas immédiat. Les traits sont présents à leur taille finale dès la première image et s'effacent. Aucun anneau offensif ne se propage après les dégâts.

Les peintures de Toma, de la compagne, des ennemis et des décors sont intactes. La queue visuelle indépendante du jeu conserve au plus 16 événements, est compactée sur place et n'utilise aucun tirage aléatoire. Une rafale de collectes est regroupée. Le rendu ne modifie jamais la simulation.

Toutes les nouvelles animations suivent le temps de simulation, donc elles s'arrêtent dans les pauses et écrans modaux. Les effets transitoires ne sont pas sauvegardés et ne sont pas rejoués lors d'une reprise. Le mode effets réduits conserve de petits pictogrammes fixes; les rayons, particules, retouches, marques de vitesse et traînées supplémentaires sont supprimés.

## Vérifications

- `npm test`: 467 tests réussis, aucun échec. Les nouveaux tests ont d'abord échoué avant implantation.
- `node scripts/verify-power-equivalence.mjs ../popescu-save-performance .`: huit parties comparées, deux graines dans chacune des quatre difficultés, 1 200 images par partie avec 300 ennemis initiaux. États de jeu, dégâts, éliminations, déplacements, projectiles, temporisateurs et RNG identiques. Seuls les anciens anneaux purement visuels `s.pulses` sont exclus de la comparaison.
- Export autonome régénéré: 14 018 968 octets. Le test natif couvre syntaxe, démarrage, images embarquées, partie, pause/reprise, sauvegardes, découvertes et phases des boss.
- `node scripts/inspect-power-animations.mjs`: vraies scènes 390 × 844, contact des trois phases par pouvoir, effets réduits et vue 320 × 640. Revue visuelle indépendante finale réussie, après correction d'un badge Mode avion doublé et renforcement de l'éclat de Vérité brute.
- `node scripts/render-power-preview.mjs`: vidéo du moteur et du rendu réels, 300 images à 24 images/s, soit 12,5 secondes. Les animations ne sont pas accélérées.
- Charge Canvas native de 300 ennemis: 23,48 ms/image sans les nouvelles animations actives, 24,00 ms avec la queue maximale de 16 effets, 22,21 ms en effets réduits. Une mesure locale isolée, pas une garantie sur téléphone.

## Limites et livraison

Cette validation utilise Canvas natif, pas un navigateur ou un téléphone physique. Le toucher, les safe areas et la cadence sur iPhone/Android ne sont pas certifiés par ces captures.

Base fonctionnelle vérifiée contre le manifeste GitHub `ea7f98cfa40c63731f9dca9fe159908a112eb9f3`; les fichiers de jeu concordent aussi avec le Site v18 `6febb191780f06017fd97bb048cac696a9b22fb8`. Quatorze sources artistiques historiques haute résolution ne sont pas disponibles octet pour octet dans cette copie locale; aucun de ces fichiers n'est utilisé ou modifié par ce lot. Les atlas d'exécution sont vérifiés et conservés.

Ce lot est préparé localement, sans envoi GitHub ni déploiement.
