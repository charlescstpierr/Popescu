# QA du rythme de partie

Vérifié le 3 novembre 2026 dans une copie isolée. Aucun déploiement.

- Suite complète: 199 tests réussis, zéro échec (183 de référence et 16 nouveaux).
- Les nouvelles vérifications couvrent les répits, l'alternance des hordes malgré les imprécisions du temps, les avertissements, la progression du final, les pauses, la limite de 300 ennemis, les apparitions différées et leur sauvegarde, la reprise ancienne sans rattrapage de jalons, et le mode infini.
- Une simulation de 18:49,8 à 20:00 utilise les vrais updates, mouvements, tirs, dégâts, améliorations et sauvegardes. L'invulnérabilité est prolongée dans ce test pour vérifier l'arrivée à la victoire, pas pour mesurer l'équilibrage humain. Les captures/restaurations restent exactement déterministes et une seule victoire est émise.
- HTML autonome régénéré: 9 514 945 octets. Adaptateur DOM/Canvas natif: syntaxe, démarrage, décodage des images embarquées, découverte, HUD, pause/reprise, sauvegarde/reprise et trois phases de dash Travestia validés.
- Renderer et tous les assets identiques à la référence par comparaison de fichiers.

Limites: ce contrôle natif ne remplace pas une partie humaine complète ni un essai tactile sur téléphone. Les annonces supplémentaires partagent la bulle existante et une réplique prioritaire de combat peut les remplacer. Les préparations graphiques et les attaques esquivables restent inchangées. Une saturation qui dure pendant toute une fenêtre de vingt secondes peut empêcher une nouvelle apparition: aucun ennemi visible n'est supprimé pour la forcer.

Intégration: appliquer seulement proof/run-pacing.patch à dist/engine.js, copier tests/run-pacing.test.js et ces documents, puis relancer la suite et reconstruire le HTML autonome depuis le projet combiné. Ne pas remplacer le moteur entier par celui de cette copie isolée, car d'autres travaux ont modifié simultanément les dialogues et les récompenses.

Revue indépendante terminée: approbation finale sans défaut bloquant. Les 16 tests du rythme passent; essais supplémentaires à cinq pas de temps et cas de saturation/reprise/expiration/infini contrôlés. Les annonces promises après le début du final sont désormais supprimées; la réserve sur les répliques prioritaires reste explicitement documentée.
