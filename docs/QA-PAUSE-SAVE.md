# Sortie de pause après échec de sauvegarde

Correctif du [ticket 71](https://github.com/charlescstpierr/Popescu/issues/71), préparé sur main `944011975c9bc34c9bec9c7cba42c1348b6fdc45` le 6 novembre 2026. Le panneau de choix a été approuvé avant son intégration.

## Contrat

- Une sauvegarde réussie rejoint le menu comme avant.
- Une erreur conserve la session en mémoire, en pause. Le joueur peut réessayer, rester en pause ou quitter explicitement sans sauvegarder les derniers progrès.
- Un conflit avec un autre onglet conserve la session sans réarmer ses écritures. Il propose de rester ou de quitter, sans promettre que la sauvegarde distante est reprenable.
- Échap revient en pause. Le focus initial est sur « Rester en pause », Tab et Maj+Tab restent dans le dialogue.
- Les opérations retardées vérifient encore leur session et leur navigation avant de remplacer un écran. Un checkpoint en attente est annulé avant écriture si sa session a été abandonnée.
- Aucun changement des clés, du format ou de la version 15 des sauvegardes. Les anciennes données restent intactes sur refus d’écriture et abandon explicite.
- Les résultats terminés et la partie volontairement sans persistance gardent leur sortie normale.

## Tests automatisés

`npm test` : **1 668 tests réussis, zéro échec, zéro ignoré**, y compris la QA graphique native disponible dans cet environnement.

Les 29 régressions de `tests/pause-save-exit.test.js` couvrent le checkpoint exact, le crédit unique, les échecs répétés, le réessai, l’abandon, le focus, les conflits, les verrous retardés, les navigations plus récentes, la reprise des dialogues/améliorations/trophées, les résultats et Charles. Elles couvrent aussi les autosaves lifecycle déjà en attente au moment de l’abandon.

Une revue indépendante a reproduit une écriture différée après « Quitter sans sauvegarder ». Trois tests ont d’abord échoué sur ce défaut, puis réussi après ajout d’une garde au moment d’acquérir le verrou et suspension des autosaves depuis le panneau.

Les exports dossier et monofichier ont été régénérés avec `scripts/export-offline.py` et `scripts/export-standalone.py`. `git diff --check` ne signale aucune erreur.

## Parcours navigateur

Copie locale isolée, sans accès aux sauvegardes personnelles du Site. La panne de stockage et les états de progression ont été préparés dans un dispositif de test local, absent des fichiers livrés.

- Panne quota : session conservée, réessai refusé puis accepté après rétablissement, retour au menu et reprise exacte.
- Abandon explicite : ancienne sauvegarde et totaux conservés.
- Deux vrais onglets : session ancienne à 17 ennemis, sauvegarde concurrente à 24; conflit affiché sans réessai, sauvegarde à 24 préservée après abandon.
- Focus initial, boucle Tab/Maj+Tab, Échap et double clic physique sur la sortie : aucune sortie involontaire observée.
- Panneaux conformes à la maquette approuvée. Petites surfaces CSS de 674 × 432 et 393 × 252 obtenues par zoom desktop : défilement utilisable et dernier bouton visible après Tab.

Limites : pas de téléphone ni de tactile matériel; le zoom desktop ne valide pas ces appareils. Le panneau du dispositif de test masquait partiellement le haut à très faible largeur. Les verrous artificiellement retardés sont couverts automatiquement, pas par le parcours navigateur. Aucun résultat de performance mobile n’est déduit de ces contrôles.
