# Nouvelle partie après un retour au menu

Le remplacement d'une partie sauvegardée utilise une confirmation dans le jeu. Annuler conserve la partie; confirmer démarre une nouvelle partie et garde les records et les totaux.

## Reproduction

Le parcours naturel jouer, pause, retour au menu, Nouvelle partie, OK passe dans le Chrome disponible. Le blocage signalé est reproduit avec une instrumentation du dialogue natif: après son acceptation, une microtâche émet `blur` puis `focus`. Le garde de démarrage annule alors la transaction, laisse le menu affiché et conserve la sauvegarde. Cette reproduction instrumentée ne prouve pas l'ordre des événements dans le navigateur de l'utilisateur.

Les tests de régression ont été ajoutés avant le correctif. Trois cas échouaient sur l'ancien code, qui affichait le jeu au lieu d'une confirmation dans le DOM.

## Vérification navigateur

Sur le code corrigé, le parcours complet jouer, passer l'introduction, pause, retour au menu, Nouvelle partie affiche la confirmation. Annuler conserve la sauvegarde octet pour octet et remet le focus sur Nouvelle partie. Confirmer remplace l'identifiant de partie et affiche 00:00. Le parcours passe avec `window.confirm` remplacé par une fonction qui lève une erreur: aucun dialogue natif n'est appelé pour remplacer une partie.

Les captures et vidéos locales sont dans `/tmp/toma-new-game-qa/`: `avant.png`, `avant.mp4`, `confirmation.png`, `apres.png` et `apres.mp4`. La vidéo avant illustre la reproduction instrumentée.

Les tests couvrent aussi la difficulté choisie, les totaux, Échap, Tab, les doubles acceptations et les interruptions pendant le verrou de sauvegarde. Le choix rare de jouer sans sauvegarde lorsque le stockage échoue conserve son dialogue natif existant.

La suite complète passe: 1 859 tests, aucun échec et aucun test ignoré. La relance utilise un répertoire temporaire local au dépôt pour éviter le quota rencontré lors du premier essai. Les exports hors ligne et monofichier ont été régénérés. Le test sur téléphone physique reste hors de cette vérification.
