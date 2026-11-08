# Survie de dix minutes

L'utilisateur demande une partie plus courte et une intégration sur `main`, en autonomie.

## Décisions

Les nouvelles parties durent 600 secondes de simulation. Une durée explicite appartient à chaque sauvegarde. Les sauvegardes publiées jusqu'au format v15 conservent 1 200 secondes. Cette distinction évite de terminer une partie ancienne lors de sa reprise et rend la migration répétable.

Une simple modification du seuil aurait supprimé la finale et réduit les occasions de développer les pouvoirs. Le temps de progression rejoint donc la courbe historique deux fois plus vite. Les déplacements, les annonces et les attaques restent en temps réel. L'expérience est doublée sur les nouvelles parties. Le premier boss arrive après 90 à 120 secondes; le repos entre boss dure 45 à 75 secondes après sa défaite. La dernière minute complète se joue entre 9:00 et 10:00. Charles et le mode infini restent disponibles.

Le temps réel d'une session comprend aussi les choix d'amélioration et les dialogues en pause. Charles conserve son combat sans limite automatique. Cette tâche ne modifie pas les images ni les animations.

## Répartition et vérification

1. Moteur et calendrier dans `run-rules.js`, `engine.js` et `boss-director.js`.
2. Texte et affichage dans `content.js`, `app.js`, `index.html` et `charles.js`.
3. Sauvegardes, historique et exports, puis vérification commune.

Les propriétaires de fichiers sont distincts. Le travail de départ reste dans ses branches; la nouvelle branche part du dernier `origin/main`.

Les tests doivent observer Charles à 600 secondes, la finale complète, le calendrier des boss, les gains d'expérience, les reprises successives, le refus des durées invalides et le crédit unique d'une victoire. Les anciennes sauvegardes doivent conserver leur état et leurs crédits après plusieurs lectures et écritures. Deux exports successifs doivent donner les mêmes fichiers.

La livraison exige une suite complète réussie, une revue indépendante et un dossier `release/` régénéré. La fusion est vérifiée par lecture du résultat GitHub et du nouveau `origin/main`.
