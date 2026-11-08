# Survie de dix minutes

Les nouvelles parties durent 600 secondes de simulation. La finale complète commence à 9:00, le dernier rival arrive à 9:20 et la dernière horde à 9:40. Charles entre à 10:00. Les fenêtres d'avertissement, les déplacements et les attaques gardent leur durée réelle.

La progression des ennemis rejoint la courbe historique deux fois plus vite. Les gains d'expérience sont doublés. Le premier boss arrive après 90 à 120 secondes, puis le prochain attend 45 à 75 secondes après la défaite du précédent. Le calendrier ne garantit pas de voir tous les boss si un combat dure longtemps.

Les sauvegardes v1 à v15 migrent vers v16 en gardant une durée de 1 200 secondes. Une seconde lecture ou reprise ne recommence pas cette migration. La durée et le calendrier des anciennes parties ne sont pas comprimés. Les clés de stockage restent inchangées.

## Vérifications

`npm test` réussit les 1 839 tests, sans échec ni test ignoré dans l'environnement local équipé de Canvas. La suite initiale comptait 1 816 tests. Les 23 nouveaux tests vérifient les durées, la progression, les textes, les sauvegardes et le résultat.

La dernière minute est également simulée avec le moteur réel, deux parties synchronisées et une reprise toutes les cinq secondes. Les six étapes finales ne sont ni répétées ni perdues. Les tests couvrent aussi une arrivée retardée par le plafond d'ennemis et son rétablissement après reprise.

Les inspecteurs du dossier hors ligne vérifient le démarrage, les images, les cinq rangs de compagne, les Lamborghini, les boss et Charles, avec sauvegarde et reprise. Les deux exports ont été exécutés deux fois; chaque fichier obtenu conserve la même empreinte SHA-256. Aucune peinture n'est modifiée.

## Publication

Le README présente les commandes, le jeu en ligne et la version hors ligne. Le workflow GitHub Actions exécute les tests et vérifie la reproductibilité de `release/` avant publication. Seul `dist/` est envoyé à GitHub Pages; les déploiements sont limités à `main`. Les actions tierces sont fixées par SHA de commit.

Gitleaks v8.30.1, téléchargé depuis sa publication officielle et vérifié par SHA-256, n'a trouvé aucun secret dans les fichiers du projet ni dans l'analyse de toutes les références Git. Les rapports utilisent la suppression des valeurs sensibles. Une recherche des chemins de fichiers de clés et d'identifiants dans toutes les références ne retourne aucun résultat. Cette analyse signale une absence de détection, pas une preuve absolue d'absence de secret.

## Limites

Les choix de cartes et certains dialogues suspendent la simulation. Charles conserve un combat sans limite automatique. Une session complète peut donc dépasser dix minutes.

Les inspecteurs utilisent Canvas et un adaptateur DOM. Ils ne valident pas le toucher, les politiques de stockage ni les performances sur un téléphone physique. Les sauvegardes du Site d'origine, de GitHub Pages et d'un fichier local restent séparées par origine.
