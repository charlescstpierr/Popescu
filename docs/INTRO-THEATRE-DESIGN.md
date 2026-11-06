# Intro fluide et théâtrale : proposition concrète

Base examinée : popescu-gameplay-20261106, 6 novembre 2026. Conception initiale ensuite implémentée en CSS uniquement, sur la base du correctif de lisibilité. Aucun dialogue ou JavaScript produit modifié. Voir QA-INTRO-THEATRE.md pour les résultats.

## Diagnostic vérifié dans le code

Trois actes existent déjà : fantasy, offline, street. Leur progression reste manuelle, sans auto-dialogue. Les cartes partagent désormais renderEncounterPresentation : les noms et portraits suivent correctement line.who, indépendamment de la scène sauvegardée.

La règle .encounter-dialogue .dialogue-art masque le support de l'ancienne animation .opening-offline .dialogue-art. Le traitement d'ouverture historique n'anime donc pas le visuel effectivement affiché. Au deuxième acte, SYSTÈME ne possède volontairement aucun portrait : le grand visuel central disparaît et un statut MESSAGE SYSTÈME reste affiché. La disparition est sémantiquement correcte mais ne raconte pas à elle seule la rupture de la photo.

Ne pas corriger ce vide en donnant un portrait à SYSTÈME. Décor narratif et portrait du locuteur doivent rester deux couches distinctes.

## Direction recommandée

Conserver l'interface théâtrale approuvée, le monde de jeu visible et les portraits exacts. Donner trois ambiances à une seule scène, plutôt qu'ajouter une quatrième carte ou une cinématique séparée. Les contrastes, la lumière et une entrée courte du portrait portent le récit. Les trois textes et actions restent inchangés.

Alternatives écartées : cinématique vidéo (poids, reprise, lecture imposée), effets de glitch répétés (fatigue, réduction du mouvement), zoom permanent (distrayant), typewriter (ralentit la lecture), rideau plein écran (cache inutilement le décor et le bouton).

### Acte 1 : la pose

Lumière dorée discrète derrière le vrai portrait de Toma, vignette périphérique. Entrée unique du portrait en 380 ms, translation verticale maximale de 8 px, sans zoom ni déformation. La lumière arrive en 520 ms. Nom, réplique, réponse et action sont lisibles immédiatement. Pas d'animation sur le bloc de texte ni le bouton.

### Acte 2 : la panne

En un passage de 180 à 240 ms, l'ambiance dorée devient froide, magenta sombre. Aucun flash blanc, aucune oscillation. Le décor de panne peut rester visible dans sa propre couche, avec son image existante si le propriétaire CSS la rétablit. SYSTÈME reste sans portrait humain. La rupture vient du contraste entre les actes, pas d'une secousse.

### Acte 3 : la réalité

Retrait du voile froid en 240 ms pour retrouver le monde réel. Retour du portrait de Toma en 320 ms, au même emplacement et à la même échelle. La dernière action demeure à position stable. Au clic, passage immédiat au tutoriel existant : aucune attente décorative avant le contrôle.

## Contrat d'implémentation

- Animations de présentation uniquement. Aucun changement de Game, OPENING, index sauvegardé, introSeen, tutoriel, clé de stockage ou progression.
- Les classes opening-fantasy/offline/street existantes suffisent. Cibler les éléments réellement visibles de encounter-dialogue, pas dialogue-art masqué.
- Ne pas réanimer le même acte à chaque renderDialogue : une classe d'acte doit être stable ; le changement d'acte suffit au déclenchement.
- Ne pas dépendre de animationend pour afficher le texte, avancer ou sauvegarder. Une animation annulée ne peut donc pas bloquer l'intro.
- Pas de timeout supplémentaire ni verrou de clic. Le filtrage existant de 220 ms reste responsable des doubles clics.
- Les commandes restent interactives pendant les animations. Les couches décoratives restent pointer-events:none et aria-hidden.
- Utiliser opacity et transform seulement sur les couches décoratives. Éviter les filtres lourds, animation de dimensions, glows infinis et rafraîchissement canvas additionnel.
- .reduced-fx ET prefers-reduced-motion:reduce désactivent animations et transitions, y compris pseudo-éléments. Les différences statiques entre actes restent visibles.
- La reprise d'une sauvegarde doit afficher directement le bon acte et son texte complet. Une courte animation décorative à la reprise est tolérable, jamais nécessaire à la reprise.
- Ne pas toucher au portrait choisi par line.who ni introduire une image associée au propriétaire de scène à sa place.

## Vérifications avant publication

Base : 39/39 tests ciblés passent (opening, story-onboarding, dialogue-presentation, dialogue-scheduling). Ce résultat ne valide pas des changements CSS non encore écrits.

Après intégration : captures navigateur de chaque acte à 390×844, 320×568, 430×932 et paysage court ; safe areas haute/basse ; texte et bouton visibles sans chevauchement ; comparaison reduced motion système et préférence interne ; image lente et image absente ; clic rapide, passer l'intro, revoir l'intro puis retour menu ; sauvegarde/reprise aux trois index ; changement d'onglet durant transition ; aucune avancée automatique ; vrai locuteur conservé.

Tests existants à relancer : opening, story-onboarding, dialogue-presentation, dialogue-scheduling, dialogue-focus, paused-dialogue-input, replay-dialogue-integration, puis npm test et export-offline. Revue visuelle indépendante nécessaire après animation. Les scripts Canvas natifs sont utiles mais ne prouvent pas le CSS navigateur ou le comportement tactile.

## Statut d'implémentation

La conception est implémentée en CSS uniquement. La panne conserve le décor de jeu réel et SYSTÈME sans portrait ; aucune illustration supplémentaire ni nouvel asset n'est introduit. Les deux éclairages statiques restent très légers. Le voile de retour a une opacité finale et sous-jacente nulle, afin de ne pas réapparaître après son animation.

Voir QA-INTRO-THEATRE.md pour la validation navigateur, la revue indépendante et les limites.
