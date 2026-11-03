# Intégration vérifiée du 3 novembre 2026

## Provenance et portée

Cette copie est reconstruite depuis le code vérifié de GitHub main `893adaf5715c891a6137427fd61094b3f5dc5105`. Elle réunit les évolutions et relances approuvées, la conservation de l’XP, la réécriture des dialogues, les effets de défaite et les soutiens-gorge roses des orangs-outans.

La copie de travail précédente n’a pas été récupérée. Ce dossier n’inclut pas tous les anciens fichiers artistiques source du dépôt: une publication doit appliquer les fichiers modifiés sur main, sans supprimer les autres fichiers distants. Aucun déploiement ni envoi GitHub n’a été effectué pendant cette intégration.

## Résultat

- Suite Node complète: **442/442 tests réussis**.
- HTML autonome régénéré avec tous les modules et les images, puis exécuté avec l’adaptateur DOM/Canvas: démarrage, images embarquées, découverte, interface, pause, sauvegarde/reprise et attaques/calendrier des boss réussis.
- Les évolutions sont bornées: deux salves de trois billets; trois cibles distinctes maximum pour un cœur, y compris après reprise.
- Les relances coûtent 5 puis 10 pièces, au maximum deux par niveau. Les nouvelles cartes et le solde sont enregistrés ensemble avant leur affichage. Quota dépassé, clic répété, clic concurrent sur une carte, fermeture et conflit d’onglet sont couverts.
- La sauvegarde v7 conserve le directeur de boss v6, le hasard, les offres et les dépenses. Les anciennes répliques de boss déjà sauvegardées restent valides.
- L’XP ne disparaît plus avec l’expiration ou le plafond des objets. Sa relocalisation cherche un trajet praticable et ne donne jamais de l’XP automatiquement.
- La défaite conserve le hasard du jeu et utilise au plus 16 effets, 128 fragments et 64 points de traînée. Les caches expirent et les effets réduits désactivent le morcellement. L’inspection native vérifie les limites des peintures complètes des boss dans les empreintes d’impact.
- L’atlas orangutan approuvé conserve ses huit cellules et ses repères. Les 19 autres images du jeu sont inchangées.

Une simulation technique d’environ dix minutes dans chacune des quatre difficultés, avec PV remis à niveau pour poursuivre le contrôle, a vérifié 340 reprises de sauvegardes exactes pour le noyau évolutions/XP/dialogues. Ce contrôle n’est pas une mesure de difficulté.

## Revues et limites

Les évolutions, la transaction de relance, les résolutions de fusion, l’XP, les effets de défaite et l’édition artistique ont reçu des revues indépendantes. Les rendus natifs emploient les vrais modules et atlas, sans mutation de la simulation.

La prévisualisation navigateur gérée était indisponible. La disposition CSS, le défilement tactile, les safe areas et les performances sur téléphone physique restent donc à vérifier. Les mesures Canvas natives ne sont pas des mesures de FPS sur iPhone ou Android.
