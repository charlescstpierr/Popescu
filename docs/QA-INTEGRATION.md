# QA de la version intégrée

Vérification du 3 novembre 2026. Copie isolée, aucun envoi GitHub et aucun déploiement.

- Les changements de récit et de récompenses de la copie `toma-story-working` sont conservés. Seul le patch de rythme, ses tests et ses documents ont été intégrés au moteur; aucun remplacement complet du moteur.
- Revue indépendante finale: aucun défaut bloquant; 38 tests ciblés de rythme, récit, intégration, récompenses et progression réussis.
- Suite finale: **218 tests réussis, zéro échec**. Journal: `proof/integrated-tests.log`.
- Trois tests d'intégration ajoutés: priorité de l'annonce du final sur le chapitre de 19:00, conservation de cette attente après reprise, report des réponses en attente et réaction immédiate au vrai cri du coq.
- Correction d'intégration: les annonces réservent leur durée de lecture réelle (minimum 4,3 secondes), avant le chapitre ou le bavardage ordinaire. Les réactions prioritaires de combat restent immédiates.
- Le final complet, la victoire unique à vingt minutes, le mode infini, les récompenses excédentaires, les plafonds d'ennemis et la reprise déterministe sont couverts par la suite.
- HTML autonome régénéré depuis cette copie: `release/Toma_Popescu_JOUER.html`, 9 518 424 octets. Contrôle DOM/Canvas natif: syntaxe, démarrage, images, découverte, HUD, pause/reprise, sauvegarde et trois phases de dash validés. Résultat: `proof/integrated-standalone.json`; capture réelle: `proof/integrated-standalone.png`.
- `dist/content.js`, `dist/run-save.js`, renderer et assets restent identiques à la copie narrative d'entrée.

Limites: le contrôle natif n'est pas un essai de navigateur ou de téléphone physique, ni une validation de difficulté par une partie humaine complète. Les annonces supplémentaires partagent la bulle existante; une réplique prioritaire de Travestia ou du coq peut les remplacer, tandis que les vrais avertissements graphiques de combat restent inchangés. Le plafond d'ennemis peut empêcher une apparition si toute sa fenêtre reste saturée, sans supprimer d'ennemi visible.
