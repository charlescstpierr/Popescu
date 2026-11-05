# Activation des boutons HUD par Espace — ticket #41

## Base et portée

Base GitHub vérifiée : `196365e2a1f221d869500fb4ba2359bb09b528c9`, après fusion de la PR #47. Les 423 fichiers matérialisés correspondent exactement à cette base, sans divergence. Les 54 fichiers distants absents localement restent conservés dans SOURCE_MANIFEST et hors du delta.

Le changement de production est limité à `dist/app.js`. Il conserve #40, la garde Échap des paramètres, les correctifs #38/#39, les alertes contextuelles, les tirages d’améliorations et les icônes approuvées. Aucun changement de dessin, CSS, texte visible, règle de combat, format v15 ou clé de sauvegarde.

## Comportement corrigé

- Espace sur Pause, Son, Passer le tutoriel ou Fermer la réplique reste disponible pour l’activation native du bouton. Une cible imbriquée est rattachée au bouton par `closest('button')`.
- Le contrôleur ne déclenche aucun clic synthétique. L’action reste celle du navigateur, notamment au relâchement d’Espace.
- Espace hors bouton et les flèches dans le HUD continuent de bloquer le défilement de page. Les répétitions Espace et Entrée restent annulées avant l’exception.
- Un appui Espace commencé sur un bouton HUD appartient à ce bouton jusqu’au relâchement. Une réinitialisation d’entrée ou un pagehide annule cet appui. Le keyup ne peut donc pas activer un bouton d’un écran ultérieur, même après un aller-retour vers le HUD.
- Un nouvel appui fonctionne après interruption, y compris si le premier keyup s’est produit hors de la fenêtre. Les touches des champs de paramètres et le défilement de la région de lecture d’un dialogue sont préservés.

## Vérifications automatisées

`tests/hud-space-activation.test.js` contient **40 tests** : les quatre boutons, cibles bouton et enfant, répétitions, Entrée, changement de focus, pause, dialogue, trophées, blur/focus, visibilité, pagehide, nouvel appui, Espace hors contrôle, mouvements, M, Échap, paramètres, lecture, joystick et sauvegardes/reprises.

Le test des trophées passe par un vrai Péli vaincu et l’ouverture de son coffre. Les tests utilisent le vrai contrôleur, Game et le stockage. L’adaptateur DOM expose les tags, `closest`, les parents et les boutons Son du vrai HTML, afin d’exercer leur véritable câblage.

- Contrôle négatif sur main avec les mêmes tests et le même adaptateur : **32 échecs attendus et huit comportements déjà corrects**.
- Candidat : **40/40 réussis**. La seule exemption keydown, sans garde keyup, laissait huit cas de transition/focus non protégés dans la première matrice.
- `npm test` final après gel du code et des tests : **1 431/1 431 réussis**, aucun échec ou test ignoré. La suite complète sérielle donne également 1 431/1 431.
- Revue indépendante favorable : **121/121 tests ciblés**, aucune anomalie bloquante. La limite d’activation native dans un navigateur demeure explicitement ouverte.
- Les exports sont régénérés; les tests natifs du dossier hors ligne et l’inspecteur du monofichier vérifient démarrage, images, rendu sans mutation, pauses, sauvegardes, reprises et rencontres.
- `node --check dist/app.js` et `git diff --check` passent.

Le dossier hors ligne courant conserve `release/Toma_Popescu_JOUER.html` et ses 32 fichiers d’assets : HTML de **651 384 octets**, SHA-256 `271e9664d4cd152b03e8f4ab7d722d2699f0a885c6d6e9b50ca2b2183fb1a768`.

Le monofichier facultatif reste sous `generated/standalone/` : **27 432 138 octets**, SHA-256 `068b794f305d0f2bbe0940b40ee383c91d79aa50f4daff7ce5e9b37a6a8a2859`. Il ne remplace pas le dossier courant et n’est pas inclus dans le delta.

## Limite navigateur et vérification restante

Les tests livrent explicitement le clic natif simulé lorsque le contrôleur laisse keydown et keyup autorisés. Ils prouvent la frontière des événements et les effets des vrais handlers, pas l’activation native d’un navigateur. Aucune validation sur navigateur réel ou téléphone physique n’est revendiquée.

Avant de déclarer le critère navigateur terminé, vérifier dans un aperçu autorisé : Tab vers chacun des quatre boutons, appui court puis maintien d’Espace, un seul clic au relâchement, Entrée, transition vers dialogue/trophées ou pause entre keydown et keyup, retour vers le HUD, absence d’action tardive, Espace hors contrôle et tactile. Refaire le parcours avec le SVG enfant du bouton Pause et confirmer les sauvegardes après rechargement.

## Livraison

Sept chemins composent ce delta. La publication doit partir de la tree distante et ne modifier que ces chemins, sans supprimer les 54 fichiers non matérialisés. Aucun déploiement du Site n’est inclus.
