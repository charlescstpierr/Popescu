# QA — Trophées de boss, 3 novembre 2026

## Candidat

Le contenu de départ est celui du commit GitHub `b154dd78cd0b423a277ba3297d12e3d04a256686`, copié depuis le dossier combiné déjà vérifié. Les PV, attaques, résistance au charme, poursuite et calendrier des boss renforcés sont conservés. Aucun envoi ni déploiement fait dans cette tâche.

Six options fixes sont proposées par les coffres des trois espèces. Un seul choix par espèce et trois trophées maximum. Les pièces, soins, bouclier, gemmes et XP ordinaires restent inchangés. Un niveau déjà ouvert est terminé avant le choix en attente. Défaite et victoire à 20:00 gardent la priorité; les choix sont repris en mode infini.

## Vérifications

- Suite complète finale locale: **668 tests réussis**. Tests ciblés pour provenance, butin sans double crédit, double clic, trois espèces, gel modal, priorité des écrans, collisions exactes et sources des dégâts.
- Sauvegardes v9: migration de vraie sauvegarde v8 et des versions plus anciennes; conservation du déplacement v8, choix en attente, délais, carte et balayage actifs. Les coffres crédités en attente sont conservés dans le plafond de 12. Validation stricte des types, propriétés, identités et bornes.
- Revue indépendante: 8 combinaisons de trophées × 1 800 pas, avec 1 440 comparaisons exactes capture/reprise, sans divergence. Aucun problème moteur bloquant restant.
- Endurance sur quatre difficultés et deux équipements de trois trophées: 8 parties atteignent 20:00 puis 25:00 en infini, avec 296 sauvegardes/reprises et comparaison exacte du pas suivant. Un boss reste vivant à la victoire dans 7 des 8 scénarios; la victoire ne dépend donc pas de sa défaite. Pic de 300 ennemis, maximum 213,063 octets par sauvegarde. Les PV artificiellement élevés isolent les invariants, pas la survie humaine. Preuve: `proof/trophies/soak.json`.
- Export autonome régénéré et exécuté dans l’adaptateur DOM/Canvas natif: syntaxe, démarrage, images incorporées, sauvegarde/reprise et attaques des boss réussis. Cette vérification n’est pas un navigateur réel.
- Aucun pixel des atlas et sources artistiques existants n’a changé. Les icônes reprennent les dessins approuvés; les portraits utilisent les acteurs existants. Une première coupe des pieds a été corrigée et revue indépendamment.
- Vraies images Canvas à 390 et 320 pixels, effets normaux et réduits: carte de 24 × 36 conforme à sa collision rectangulaire balayée; secteur de 100 pixels et 120° conforme à sa collision; couronnes lisibles. Rendu sans mutation de la simulation.
- Contrôleur UI: deux choix, focus clavier, clics répétés, HUD de recharge sans rang, messages d’acquisition différés après les autres menus. Chaque message dure 1,5 seconde de simulation et se fige pendant une pause.

## Équilibrage mesuré

Le script `scripts/verify-trophy-balance.mjs` exécute 144 combats: quatre difficultés, quatre équipements de début/milieu/fin de partie, trois boss, puis aucun trophée, trois offensifs ou trois défensifs. Il utilise la vraie IA, les dégâts et projectiles, avec terrain ouvert et déplacement circulaire déterministe, sans invulnérabilité artificielle.

- Tous les combats sont gagnés et aucun joueur de ce scénario ne meurt.
- Sans trophées: 21,033 à 48,883 secondes. Offensifs: 20 à 47,2 secondes.
- Gain offensif moyen de 3,142 %, maximum de 11,576 %. Aucun combat inférieur à 20 secondes. Les PV renforcés sont strictement identiques dans chaque comparaison.
- Les options défensives changent peu le temps nécessaire et réduisent les dégâts réellement subis. Le scénario circulaire esquive déjà beaucoup; ce résultat ne mesure ni un taux de victoire humain ni la difficulté perçue.
- Les nombres proposés restent donc inchangés: tarot 18/passage, protection 12, panache 20, vitesse ×1,25, charme 2 acteurs/2,5 s, badge −2.

Preuves: `proof/trophies/balance.json` et `proof/trophies/performance.json`.

## Performance et limites

Sur 300 acteurs maintenus pendant 1 440 images, cinq répétitions déterministes après chauffe donnent une moyenne médiane de 1,487 ms/pas sans trophée, 1,455 ms offensifs et 1,416 ms défensifs. Les différences incluent des trajectoires différentes et du bruit de mesure: aucune amélioration de performance n’est revendiquée. Aucun ralentissement mesuré. Il s’agit du moteur Node, pas de FPS navigateur ou mobile.

La sauvegarde d’une scène de 300 acteurs mesure 132 254 octets, médiane de 13,98 ms et p95 de 22,88 ms sur 60 mesures locales. Les écritures gardent leur cadence existante et la validation reste intacte.

Le lancement de Chromium local a été refusé par la restriction socket. Aucun contournement effectué. Les captures DOM/CSS, gestes tactiles émulés et petit écran réel restent à valider via le preview géré ou un téléphone. `scripts/inspect-trophies.mjs` fournit le scénario navigateur, mais n’a pas été exécuté avec succès ici. À 320 × 568, le panneau conserve volontairement une surface défilante unique; les tests natifs ne certifient pas sa mise en page réelle.

Les preuves natives sont dans `proof/trophies/`; les SHA des 52 fichiers runtime figés sont dans `runtime-frozen.json`.

## Validation navigateur finale

Après le blocage du Chromium local mentionné ci-dessus, un navigateur Chromium cloud géré a exécuté les 52 fichiers runtime inchangés dans des cadres de 390 × 844 et 320 × 568. Les 20 contrôles réussissent : les trois espèces, les six choix, les pauses et reprises, les cartes défilantes au petit format et l’absence de double crédit. Aucun message d’erreur de l’application; les erreurs d’extension sont comptées séparément. Les sauvegardes de départ sont des fixtures RunStore valides, sans injection dans l’état interne du moteur. Voir `proof/trophies/browser-qa.json`.

Cette validation remplace uniquement la réserve de mise en page Chromium du paragraphe précédent. Elle ne certifie ni le toucher physique, ni Safari iOS, ni les safe areas, ni les performances matérielles. Les fixtures calmes ne constituent pas un nouveau contrôle de combat ou d’équilibrage.

## Contenu du dépôt

Les fichiers JSON bruts de validation conservés localement sous `proof/trophies/` ne sont pas inclus dans cette intégration. Les chemins de preuves mentionnés ci-dessus décrivent les vérifications locales; ils ne sont pas des pièces jointes publiées dans le dépôt. Les tests reproductibles et les captures graphiques sont inclus.
