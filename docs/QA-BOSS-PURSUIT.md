# QA : poursuite des boss hors champ

## Problème reproduit

Base locale `6f57f62` (code de jeu identique à la fusion `8b95` selon la vérification d’intégration). Les trois boss majeurs étaient supprimés à 1 600 px exactement comme les ennemis ordinaires. Sur la graine 42, maintenir la droite pendant vingt minutes supprimait ainsi huit boss, sans une seule attaque spéciale; chaque boss n’était visible que 0 à 3,1 secondes.

## Correction limitée

Un boss dépassant cette distance revient hors champ, devant la direction de déplacement si elle existe. C’est le même ennemi: identifiant, PV restants et séquence d’attaques conservés. Aucun soin, nouvelle récompense, coffre, augmentation de PV ou deuxième boss n’est ajouté. Les ennemis ordinaires gardent leur suppression normale.

Le placement vérifie le corps entier et son approche contre les obstacles. Il est à au moins 520 px, hors de la caméra, et remet les attaques en attente pendant 2,5 secondes; les préparations normales de Travestia et de Péli restent complètes. Une attaque déjà engagée est annulée, donc aucun ancien couloir, anneau ou carte ne se transporte jusqu’au joueur. La recherche est limitée à 24 directions, avec une nouvelle tentative au plus deux fois par seconde si tout est bloqué. Elle ne consomme aucun nombre aléatoire du combat.

Une ancienne sauvegarde contenant déjà deux boss conserve les deux, mais le second attend hors champ tant qu’un autre est à moins de 1 600 px. La sauvegarde ne change pas de format. La victoire reste la survie à vingt minutes, même avec un boss vivant; l’infini reste optionnel. Aucun écran, dessin, son, contrôle ou système permanent de progression n’est ajouté.

## Comparaison réelle

Simulations du moteur complet à 30 Hz, terrain, apparitions, dégâts et progression actifs. Aucun PV, invulnérabilité ou ennemi modifié. Chaque contrôleur choisit la première amélioration proposée:
- `east`: maintient la droite, sans éviter le danger.
- `weave`: avance en zigzag périodique, sans tenir compte du terrain.
- `collector`: cherche les cristaux proches, teste seize directions praticables et évite les ennemis proches.

| Graine | Contrôleur | Avant | Après | Boss supprimés avant | Retours après |
| --- | --- | --- | --- | --- | --- |
| 42 | east | victoire 20:00 | défaite 3:29 | 8 | 3 |
| 42 | weave | défaite 3:09 | défaite 3:09 | 0 | 0 |
| 42 | collector | victoire 20:00 | victoire 20:00 | 1 | 2 |
| 71 | east | défaite 5:05 | défaite 5:33 | 1 | 7 |
| 71 | weave | défaite 1:09 | défaite 1:09 | 0 | 0 |
| 71 | collector | victoire 20:00 | victoire 20:00 | 0 | 0 |
| 2026 | east | victoire 20:00 | défaite 4:49 | 9 | 6 |
| 2026 | weave | défaite 1:05 | défaite 1:05 | 0 | 0 |
| 2026 | collector | victoire 20:00 | victoire 20:00 | 2 | 2 |

Les trois contrôleurs actifs atteignent encore vingt minutes et éliminent respectivement cinq, cinq et quatre boss. Les mouvements fixes ne sont pas un test de compétence humaine. Les résultats inchangés avant une première fuite confirment aussi que la correction ne touche pas le début de ces parties.

Pour la graine 42 avec `collector`, les quatre difficultés atteignent vingt minutes avant et après. La difficulté Cauchemar diverge fortement après un retour de boss: trajectoire, ramassage et tirages changent. Ces cas ne permettent donc pas d’affirmer que chaque partie devient plus difficile, ni d’estimer un taux de victoire humain.

Deux graines supplémentaires testées indépendamment nuancent le résultat: `east` gagne encore sur 123 après 41 retours et quatre vraies défaites de boss (au lieu de huit suppressions gratuites); sur 859, il meurt à 3:59 au lieu de 5:10. `collector` meurt à 2:03 avant tout boss sur 123, et gagne à vingt minutes sur 859, dans les deux versions. La correction empêche donc la disparition gratuite, sans promettre qu’un déplacement simple ne peut jamais gagner.

## Vérifications

- `npm test`: 476 tests réussis, dont neuf cas dédiés. Les premiers tests dédiés ont été exécutés avant le correctif: cinq échecs attendus, puis tous réussis. Le cas des deux anciens boss a également échoué avant sa correction, puis réussi.
- Placement contrôlé dans 288 combinaisons: quatre graines, trois formats d’écran, trois boss, huit directions. Hors champ, hors obstacles et sans nouvelle identité.
- La revue indépendante a contrôlé 6 912 placements supplémentaires (36 graines, quatre formats, seize directions et trois boss) et treize états d’attaque anciens, tous hors champ et sauvegardables.
- Attaques préparées, état de sauvegarde/reprise déterministe, attente sur terrain bloqué, gel en pause, absence de récompense sur retour, victoire avec boss vivant et passage à l’infini couverts.
- `node scripts/verify-boss-durability.mjs`: toutes les configurations passent; la formule de PV et les attaques restent inchangées.
- `node scripts/verify-boss-arrivals.mjs`: vingt minutes puis cinq minutes d’infini, dans les quatre difficultés, avec sauvegardes. Ce test contrôle volontairement survie et défaites des boss; ce n’est pas un test d’équilibrage.
- HTML autonome régénéré. `node scripts/inspect-standalone.cjs /tmp/toma-pursuit.png`: démarrage, images embarquées, rendu non mutateur, sauvegardes, attaques, directeur et reprise réussis avec adaptateur DOM/Canvas natif.

## Reproduire

```sh
npm test
node scripts/verify-boss-pursuit.mjs . 42 east normal
node scripts/verify-boss-pursuit.mjs . 71 collector normal
# Même script contre un autre checkout pour mesurer la base:
node scripts/verify-boss-pursuit.mjs /chemin/vers/la/base 42 east normal
python3 scripts/export-standalone.py release/Toma_Popescu_JOUER.html
node scripts/inspect-standalone.cjs /tmp/toma-pursuit.png
```

## Limites et intégration

Pas de test humain, de navigateur réel ou de téléphone physique. Le plaisir et la lisibilité ressentie des retours restent à essayer en jouant. Le contrôleur `collector` fait beaucoup de choix par seconde et ne représente pas un joueur moyen. Aucune statistique de victoire générale n’est déduite de ces graines. Rejouer les mêmes scénarios après intégration d’un autre changement de progression, notamment le placement des cristaux.

La revue indépendante finale n’a relevé aucun blocage: 476 tests complets et 71 tests ciblés réussis, puis les six paires ordonnées possibles d’anciens boss contrôlées avec attente, vraie défaite du premier, retour du second, sauvegarde/reprise et victoire à vingt minutes. Aucun envoi Git ni déploiement n’a été fait dans cette tâche.
