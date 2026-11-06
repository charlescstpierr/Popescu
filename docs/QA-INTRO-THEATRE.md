# Intro théâtrale — QA du 6 novembre 2026

Le candidat conserve le correctif de lisibilité de l’intro et ajoute uniquement des règles CSS. Aucun texte, portrait source, JavaScript produit, moteur ou format de sauvegarde ne change. Les hashes de opening.js, app.js et dialogue-presentation.js correspondent exactement à la base.

Les trois actes utilisent les mêmes éléments visibles : lumière dorée et entrée du portrait de 380 ms, lumière froide de panne de 240 ms sans flash ni visage attribué à SYSTÈME, retour de Toma en 320 ms et retrait du voile en 240 ms. Texte, noms et actions n'attendent jamais une animation. Pas de minuterie, nouvelle avance automatique ou dépendance à animationend.

## Tests

Quatre contrats de source couvrent animations finies/décoratives, absence d’animation sur lecture/commandes, les deux modes reduced motion, et opacité finale nulle du voile street. Les trois premiers ont échoué avant ajout du CSS puis réussi. La suite finale réussit 1619/1619 tests. Export hors ligne régénéré.

## Chromium réel

Prévisualisation officielle Sites, harness de diagnostic isolé dans une iframe de l’application réelle. Le harness clique les contrôles existants, mesure immédiatement après leur gestionnaire puis après stabilisation. Ce n’est pas une simulation Canvas. Le harness ne fait pas partie du produit.

- 390×844 : textes 169/169, 169/169 et 188/188 pixels (clientHeight/scrollHeight). Action à y814, dans le viewport de 844 px.
- 320×568 : textes 80/80, 80/80 et 98/98 px. Action à y546.
- 568×320 : trois textes 87/87px. Action à y302. Grille paysage conservée.
- À chaque acte et taille mesurée : texte complet dès la première mesure, opacité 1, aucune animation sur texte/bouton, bouton non désactivé, décoration sans capture de clic.
- Préférence interne « effets réduits » : aucune animation du portrait ou de la lumière aux trois actes. Lumière finale 1/1/0.

## Revue indépendante

Un second agent a relu le code, exécuté la suite (1618 tests avant ajout du dernier contrat d’opacité), puis inspecté dans son propre onglet les trois actes 390×844, le dernier acte 320×568, le premier acte paysage 568×320 et les mesures d’effets réduits. Aucun défaut bloquant. Vrai portrait de Toma conservé, SYSTÈME sans portrait, boutons accessibles. Il n’a modifié aucun fichier.

## Reproduction

Copier scripts/qa-intro.html vers dist/qa-intro.html, démarrer sites-preview avec le checkout, ouvrir qa-intro.html. Tester tailles et effets réduits. Pour le benchmark, utiliser « Comparer 3 paires » sans changer d’onglet ni lancer d’autre revue navigateur. Supprimer la copie dist/qa-intro.html avant livraison. Les mesures rAF de navigateur distant ne sont pas des performances téléphone.

## Limites

La préférence système prefers-reduced-motion est couverte par contrats CSS et revue, mais n’a pas été activée dans Chromium. Pas de téléphone physique, mesure tactile matérielle ou validation GPU mobile. Les premières mesures concurrentes ont été écartées car le focus partagé et les onglets ont perturbé les horloges d’animation.

## Mesure de fluidité

Trois paires alternées de 180 intervalles requestAnimationFrame, soit 1 080 intervalles à 390×844, avec/sans le nouveau bloc visuel. Données brutes : proof/intro-theatre/browser-frame-times.json. p95 entre 16,7 et 16,8 ms dans les deux variantes. La médiane des moyennes par passage est 16,66 ms sans théâtre et 16,94 ms avec théâtre. Les deux variantes présentent des pauses isolées proches de 1 016 ms malgré zéro hiddenFrames ; le navigateur distant reste donc bruité, et ces chiffres ne démontrent pas l'absence absolue de saccades ni une performance téléphone. Aucun ralentissement soutenu mesuré au p95.

Contrôle exclusif final des éclairages après 550 ms : fantasy 0,999919, offline 1, street 0. Le voile final ne réapparaît pas ; les textes restent opaques et non animés, les boutons non désactivés.
